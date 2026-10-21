/**
 * Cloudflare Workers REST API Implementation
 * Handles:
 * - Public Restaurant Settings, Categories, Menu
 * - Customer Order Placement (with strict server recalculation & validation)
 * - Order Status Tracking by Order Number
 * - Owner One-Time Bootstrap (permanently locked once owner exists)
 * - Owner Authentication (PBKDF2, sessions, CSRF, brute-force protection)
 * - Owner Admin endpoints for Menu, Categories, Orders, Settings
 * - Authenticated R2 Image Uploads with MIME and size validation
 */

import type { Env, RestaurantSettings, MenuCategory, MenuItem, Order, OrderItem, CreateOrderPayload, OwnerAccount } from './types.ts';
import { generateSecureToken, generateId, sha256, hashPassword, verifyPassword, constantTimeCompare } from './crypto.ts';

const SESSION_COOKIE_NAME = 'rs_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// JSON response helper
function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...headers
    }
  });
}

function errorResponse(message: string, status = 400, details?: unknown): Response {
  return jsonResponse({ error: message, details }, status);
}

// Cookie parser helper
function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) {
      return decodeURIComponent(c.substring(name.length + 1));
    }
  }
  return null;
}

// Client IP extractor
function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
         '127.0.0.1';
}

// Verify Authenticated Owner Session
async function getAuthenticatedOwner(request: Request, env: Env): Promise<{ owner: OwnerAccount; token: string } | null> {
  const sessionToken = getCookie(request, SESSION_COOKIE_NAME) || request.headers.get('X-Session-Token');
  if (!sessionToken) return null;

  const tokenHash = await sha256(sessionToken);
  const now = new Date().toISOString();

  const sessionRow = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?'
  ).bind(tokenHash, now).first<any>();

  if (!sessionRow) return null;

  const owner = await env.DB.prepare(
    'SELECT id, username, password_hash, salt, created_at, last_login_at FROM owner_accounts WHERE id = ?'
  ).bind(sessionRow.owner_id).first<OwnerAccount>();

  if (!owner) return null;
  return { owner, token: sessionToken };
}

// CSRF check for state-mutating requests when authenticated via cookie
async function verifyCsrf(request: Request): Promise<boolean> {
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  const csrfHeader = request.headers.get('X-CSRF-Token');
  const csrfCookie = getCookie(request, 'rs_csrf');

  if (!csrfHeader || !csrfCookie) return false;
  return constantTimeCompare(csrfHeader, csrfCookie);
}

// Format Order Number: RS-YYYYMMDD-XXXX
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RS-${year}${month}${day}-${rand}`;
}

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method;
  const clientIp = getClientIp(request);

  // Handle CORS preflight if needed
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Session-Token',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  try {
    // ----------------------------------------------------
    // 1. PUBLIC & CSRF UTILITIES
    // ----------------------------------------------------
    if (path === '/auth/csrf' && method === 'GET') {
      const csrfToken = generateSecureToken(16);
      return jsonResponse({ csrfToken }, 200, {
        'Set-Cookie': `rs_csrf=${csrfToken}; Path=/; SameSite=Lax; Max-Age=86400`
      });
    }

    // ----------------------------------------------------
    // 2. RESTAURANT SETTINGS
    // ----------------------------------------------------
    if (path === '/settings' && method === 'GET') {
      const settings = await env.DB.prepare(
        'SELECT * FROM restaurant_settings WHERE id = ?'
      ).bind('default').first<RestaurantSettings>();

      if (!settings) {
        return errorResponse('Restaurant settings not found', 404);
      }
      return jsonResponse(settings);
    }

    if (path === '/settings' && method === 'PUT') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const body = await request.json() as Partial<RestaurantSettings>;
      if (!body.name || !body.address || !body.phone) {
        return errorResponse('Restaurant name, address, and phone are required', 400);
      }

      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE restaurant_settings SET
          name = ?,
          tagline = ?,
          description = ?,
          logo_url = ?,
          hero_url = ?,
          address = ?,
          phone = ?,
          email = ?,
          currency = ?,
          delivery_enabled = ?,
          pickup_enabled = ?,
          delivery_charge = ?,
          min_order_amount = ?,
          free_delivery_threshold = ?,
          opening_hours = ?,
          updated_at = ?
        WHERE id = 'default'
      `).bind(
        body.name.trim(),
        (body.tagline || '').trim(),
        (body.description || '').trim(),
        (body.logo_url || '').trim(),
        (body.hero_url || '').trim(),
        body.address.trim(),
        body.phone.trim(),
        (body.email || '').trim(),
        body.currency || '£',
        body.delivery_enabled ? 1 : 0,
        body.pickup_enabled ? 1 : 0,
        Math.max(0, Number(body.delivery_charge || 0)),
        Math.max(0, Number(body.min_order_amount || 0)),
        Math.max(0, Number(body.free_delivery_threshold || 0)),
        (body.opening_hours || '').trim(),
        now
      ).run();

      const updated = await env.DB.prepare(
        'SELECT * FROM restaurant_settings WHERE id = ?'
      ).bind('default').first<RestaurantSettings>();
      return jsonResponse(updated);
    }

    // ----------------------------------------------------
    // 3. MENU CATEGORIES
    // ----------------------------------------------------
    if (path === '/categories' && method === 'GET') {
      const auth = await getAuthenticatedOwner(request, env);
      const query = auth
        ? 'SELECT * FROM menu_categories ORDER BY display_order ASC'
        : 'SELECT * FROM menu_categories WHERE is_active = 1 ORDER BY display_order ASC';

      const res = await env.DB.prepare(query).all<MenuCategory>();
      return jsonResponse(res.results || []);
    }

    if (path === '/categories' && method === 'POST') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const body = await request.json() as Partial<MenuCategory>;
      if (!body.name || !body.name.trim()) {
        return errorResponse('Category name is required', 400);
      }

      const id = generateId('cat');
      const slug = (body.slug || body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const order = Number(body.display_order ?? 0);
      const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO menu_categories (id, name, slug, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, body.name.trim(), slug, order, isActive, now, now).run();

      const created = await env.DB.prepare(
        'SELECT * FROM menu_categories WHERE id = ?'
      ).bind(id).first<MenuCategory>();
      return jsonResponse(created, 201);
    }

    if (path.startsWith('/categories/') && method === 'PUT') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const id = path.split('/')[2];
      const body = await request.json() as Partial<MenuCategory>;
      if (!body.name || !body.name.trim()) {
        return errorResponse('Category name is required', 400);
      }

      const slug = (body.slug || body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const order = Number(body.display_order ?? 0);
      const isActive = body.is_active ? 1 : 0;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE menu_categories SET
          name = ?,
          slug = ?,
          display_order = ?,
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(body.name.trim(), slug, order, isActive, now, id).run();

      const updated = await env.DB.prepare(
        'SELECT * FROM menu_categories WHERE id = ?'
      ).bind(id).first<MenuCategory>();
      return jsonResponse(updated);
    }

    if (path.startsWith('/categories/') && method === 'DELETE') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Category removed' });
    }

    // ----------------------------------------------------
    // 4. MENU ITEMS
    // ----------------------------------------------------
    if (path === '/menu' && method === 'GET') {
      const auth = await getAuthenticatedOwner(request, env);
      const query = auth
        ? 'SELECT * FROM menu_items ORDER BY sort_order ASC'
        : 'SELECT * FROM menu_items WHERE is_active = 1 ORDER BY sort_order ASC';

      const res = await env.DB.prepare(query).all<MenuItem>();
      return jsonResponse(res.results || []);
    }

    if (path === '/menu' && method === 'POST') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const body = await request.json() as Partial<MenuItem>;
      if (!body.name || !body.category_id || body.price === undefined) {
        return errorResponse('Item name, category, and price are required', 400);
      }

      const price = Number(body.price);
      if (isNaN(price) || price < 0) {
        return errorResponse('Price must be a valid positive number', 400);
      }

      const id = generateId('item');
      const slug = (body.slug || body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO menu_items (
          id, category_id, name, slug, description, price, image_url,
          is_active, is_available, dietary_flags, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.category_id,
        body.name.trim(),
        slug,
        (body.description || '').trim(),
        price,
        body.image_url || null,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
        body.is_available !== undefined ? (body.is_available ? 1 : 0) : 1,
        (body.dietary_flags || '').trim(),
        Number(body.sort_order || 0),
        now,
        now
      ).run();

      const created = await env.DB.prepare('SELECT * FROM menu_items WHERE id = ?').bind(id).first<MenuItem>();
      return jsonResponse(created, 201);
    }

    if (path.startsWith('/menu/') && method === 'PUT') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const id = path.split('/')[2];
      const body = await request.json() as Partial<MenuItem>;

      // Quick toggle for is_available or is_active
      if (Object.keys(body).length === 1 && body.is_available !== undefined) {
        const now = new Date().toISOString();
        await env.DB.prepare(
          'UPDATE menu_items SET is_available = ?, updated_at = ? WHERE id = ?'
        ).bind(body.is_available ? 1 : 0, now, id).run();
        const updated = await env.DB.prepare('SELECT * FROM menu_items WHERE id = ?').bind(id).first<MenuItem>();
        return jsonResponse(updated);
      }

      if (Object.keys(body).length === 1 && body.is_active !== undefined) {
        const now = new Date().toISOString();
        await env.DB.prepare(
          'UPDATE menu_items SET is_active = ?, updated_at = ? WHERE id = ?'
        ).bind(body.is_active ? 1 : 0, now, id).run();
        const updated = await env.DB.prepare('SELECT * FROM menu_items WHERE id = ?').bind(id).first<MenuItem>();
        return jsonResponse(updated);
      }

      if (!body.name || !body.category_id || body.price === undefined) {
        return errorResponse('Item name, category, and price are required', 400);
      }

      const price = Number(body.price);
      if (isNaN(price) || price < 0) {
        return errorResponse('Price must be a valid positive number', 400);
      }

      const slug = (body.slug || body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE menu_items SET
          category_id = ?,
          name = ?,
          slug = ?,
          description = ?,
          price = ?,
          image_url = ?,
          is_active = ?,
          is_available = ?,
          dietary_flags = ?,
          sort_order = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        body.category_id,
        body.name.trim(),
        slug,
        (body.description || '').trim(),
        price,
        body.image_url || null,
        body.is_active ? 1 : 0,
        body.is_available ? 1 : 0,
        (body.dietary_flags || '').trim(),
        Number(body.sort_order || 0),
        now,
        id
      ).run();

      const updated = await env.DB.prepare('SELECT * FROM menu_items WHERE id = ?').bind(id).first<MenuItem>();
      return jsonResponse(updated);
    }

    if (path.startsWith('/menu/') && method === 'DELETE') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Item deleted' });
    }

    // ----------------------------------------------------
    // 5. ORDERS & CHECKOUT
    // ----------------------------------------------------
    if (path === '/orders' && method === 'POST') {
      // Customer Checkout
      const body = await request.json() as CreateOrderPayload;

      // 1. Validate inputs
      if (!body.customer_name || !body.customer_name.trim()) {
        return errorResponse('Customer name is required', 400);
      }
      if (!body.customer_phone || !body.customer_phone.trim()) {
        return errorResponse('Customer phone number is required', 400);
      }
      if (!['delivery', 'pickup'].includes(body.order_type)) {
        return errorResponse('Invalid order type', 400);
      }
      if (body.order_type === 'delivery' && (!body.delivery_address || !body.delivery_address.trim())) {
        return errorResponse('Delivery address is required for home delivery orders', 400);
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return errorResponse('Cart is empty. Please add items before placing order.', 400);
      }

      // 2. Fetch current restaurant settings to verify service status & delivery pricing
      const settings = await env.DB.prepare('SELECT * FROM restaurant_settings WHERE id = ?').bind('default').first<RestaurantSettings>();
      if (!settings) {
        return errorResponse('Restaurant is currently unavailable', 503);
      }

      if (body.order_type === 'delivery' && !settings.delivery_enabled) {
        return errorResponse('Home delivery is currently disabled by the restaurant', 400);
      }
      if (body.order_type === 'pickup' && !settings.pickup_enabled) {
        return errorResponse('Pick up service is currently disabled by the restaurant', 400);
      }

      // 3. Verify that all ordered items exist, are active, and available.
      // Recalculate totals on the server using verified prices.
      let subtotal = 0;
      const orderItemsToInsert: Array<{
        id: string;
        menu_item_id: string;
        item_name: string;
        unit_price: number;
        quantity: number;
        total_price: number;
        notes?: string;
      }> = [];

      for (const cartItem of body.items) {
        const qty = Math.floor(Number(cartItem.quantity));
        if (isNaN(qty) || qty <= 0) {
          return errorResponse('Invalid quantity for ordered item', 400);
        }

        const menuItem = await env.DB.prepare(
          'SELECT * FROM menu_items WHERE id = ?'
        ).bind(cartItem.menu_item_id).first<MenuItem>();

        if (!menuItem) {
          return errorResponse(`Item not found in menu: ${cartItem.menu_item_id}`, 400);
        }
        if (!menuItem.is_active) {
          return errorResponse(`"${menuItem.name}" is no longer on the active menu.`, 400);
        }
        if (!menuItem.is_available) {
          return errorResponse(`"${menuItem.name}" is currently sold out. Please update your basket.`, 400);
        }

        const itemTotal = Number((menuItem.price * qty).toFixed(2));
        subtotal = Number((subtotal + itemTotal).toFixed(2));

        orderItemsToInsert.push({
          id: generateId('oi'),
          menu_item_id: menuItem.id,
          item_name: menuItem.name, // Snapshot
          unit_price: menuItem.price, // Snapshot
          quantity: qty,
          total_price: itemTotal,
          notes: cartItem.notes ? cartItem.notes.trim() : undefined
        });
      }

      // Check minimum order amount
      if (settings.min_order_amount > 0 && subtotal < settings.min_order_amount) {
        return errorResponse(
          `Minimum order subtotal is ${settings.currency}${settings.min_order_amount.toFixed(2)}. Your subtotal is ${settings.currency}${subtotal.toFixed(2)}.`,
          400
        );
      }

      // Calculate delivery fee
      let deliveryCharge = 0;
      if (body.order_type === 'delivery') {
        if (settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold) {
          deliveryCharge = 0; // Free delivery threshold reached
        } else {
          deliveryCharge = settings.delivery_charge;
        }
      }

      const total = Number((subtotal + deliveryCharge).toFixed(2));
      const orderId = generateId('ord');
      const orderNumber = generateOrderNumber();
      const paymentMethod = body.order_type === 'delivery' ? 'cash_on_delivery' : 'pay_at_pickup';
      const now = new Date().toISOString();

      // Insert Order record
      await env.DB.prepare(`
        INSERT INTO orders (
          id, order_number, order_type, customer_name, customer_phone, customer_email,
          delivery_address, order_notes, subtotal, delivery_charge, total, status,
          payment_method, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        orderNumber,
        body.order_type,
        body.customer_name.trim(),
        body.customer_phone.trim(),
        body.customer_email ? body.customer_email.trim() : null,
        body.order_type === 'delivery' ? body.delivery_address!.trim() : null,
        body.order_notes ? body.order_notes.trim() : null,
        subtotal,
        deliveryCharge,
        total,
        'received',
        paymentMethod,
        'pending',
        now,
        now
      ).run();

      // Insert Order Items (with snapshot names & prices)
      for (const oi of orderItemsToInsert) {
        await env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, menu_item_id, item_name, unit_price, quantity, total_price, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          oi.id,
          orderId,
          oi.menu_item_id,
          oi.item_name,
          oi.unit_price,
          oi.quantity,
          oi.total_price,
          oi.notes || null,
          now
        ).run();
      }

      // Return complete order details
      return jsonResponse({
        success: true,
        order: {
          id: orderId,
          order_number: orderNumber,
          order_type: body.order_type,
          customer_name: body.customer_name.trim(),
          customer_phone: body.customer_phone.trim(),
          customer_email: body.customer_email || null,
          delivery_address: body.order_type === 'delivery' ? body.delivery_address : null,
          order_notes: body.order_notes || null,
          subtotal,
          delivery_charge: deliveryCharge,
          total,
          status: 'received',
          payment_method: paymentMethod,
          payment_status: 'pending',
          created_at: now,
          items: orderItemsToInsert
        }
      }, 201);
    }

    if (path === '/orders' && method === 'GET') {
      // Owner Order List
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);

      const ordersRes = await env.DB.prepare(
        'SELECT * FROM orders ORDER BY created_at DESC'
      ).all<Order>();
      const orders = ordersRes.results || [];

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (ord) => {
          const itemsRes = await env.DB.prepare(
            'SELECT * FROM order_items WHERE order_id = ?'
          ).bind(ord.id).all<OrderItem>();
          return {
            ...ord,
            items: itemsRes.results || []
          };
        })
      );

      return jsonResponse(ordersWithItems);
    }

    if (path.startsWith('/orders/track/') && method === 'GET') {
      // Public order tracking by order number
      const orderNumber = path.split('/')[3]?.trim();
      if (!orderNumber) return errorResponse('Order number is required', 400);

      const order = await env.DB.prepare(
        'SELECT * FROM orders WHERE order_number = ?'
      ).bind(orderNumber).first<Order>();

      if (!order) return errorResponse('Order not found', 404);

      const itemsRes = await env.DB.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).bind(order.id).all<OrderItem>();

      return jsonResponse({
        ...order,
        items: itemsRes.results || []
      });
    }

    if (path.startsWith('/orders/') && path.endsWith('/status') && method === 'PATCH') {
      // Owner update order status
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const parts = path.split('/');
      const orderId = parts[2];
      const body = await request.json() as { status: string };

      const validStatuses = ['received', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const now = new Date().toISOString();
      await env.DB.prepare(
        'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
      ).bind(body.status, now, orderId).run();

      const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first<Order>();
      return jsonResponse(updated);
    }

    // ----------------------------------------------------
    // 6. OWNER AUTHENTICATION & BOOTSTRAP
    // ----------------------------------------------------
    if (path === '/auth/bootstrap-status' && method === 'GET') {
      const countRes = await env.DB.prepare('SELECT COUNT(*) as count FROM owner_accounts').first<any>();
      const count = Number(countRes?.count ?? countRes?.['COUNT(*)'] ?? 0);
      return jsonResponse({
        needsBootstrap: count === 0,
        hasSecretConfigured: Boolean(env.BOOTSTRAP_SECRET)
      });
    }

    if (path === '/auth/bootstrap' && method === 'POST') {
      // Strictly one-time owner bootstrap
      const countRes = await env.DB.prepare('SELECT COUNT(*) as count FROM owner_accounts').first<any>();
      const count = Number(countRes?.count ?? countRes?.['COUNT(*)'] ?? 0);
      if (count > 0) {
        return errorResponse('Setup is permanently disabled because an owner account already exists.', 403);
      }

      const body = await request.json() as {
        username?: string;
        password?: string;
        bootstrap_secret?: string;
      };

      if (!body.username || body.username.trim().length < 3) {
        return errorResponse('Username must be at least 3 characters', 400);
      }
      if (!body.password || body.password.length < 8) {
        return errorResponse('Password must be at least 8 characters long', 400);
      }

      // If BOOTSTRAP_SECRET is configured in env, require it
      if (env.BOOTSTRAP_SECRET) {
        if (!body.bootstrap_secret || !constantTimeCompare(body.bootstrap_secret, env.BOOTSTRAP_SECRET)) {
          return errorResponse('Invalid bootstrap secret key.', 403);
        }
      }

      // Hash owner password using PBKDF2 with SHA-256 and unique salt
      const { hash, salt } = await hashPassword(body.password);
      const ownerId = generateId('owner');
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO owner_accounts (id, username, password_hash, salt, created_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(ownerId, body.username.trim().toLowerCase(), hash, salt, now, now).run();

      // Issue session token immediately for smooth onboarding
      const rawSessionToken = generateSecureToken(32);
      const tokenHash = await sha256(rawSessionToken);
      const sessionId = generateId('sess');
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

      await env.DB.prepare(`
        INSERT INTO sessions (id, token_hash, owner_id, expires_at, created_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(sessionId, tokenHash, ownerId, expiresAt, now, request.headers.get('User-Agent') || '', clientIp).run();

      const csrfToken = generateSecureToken(16);

      return jsonResponse({
        success: true,
        message: 'Owner account successfully created!',
        user: { id: ownerId, username: body.username.trim().toLowerCase() },
        csrfToken
      }, 201, {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${rawSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}`
      });
    }

    if (path === '/auth/login' && method === 'POST') {
      // Brute-force rate limit checking
      const rateLimitKey = `login_${clientIp}`;
      const now = new Date();
      const rateLimitRecord = await env.DB.prepare(
        'SELECT * FROM auth_rate_limits WHERE key = ?'
      ).bind(rateLimitKey).first<any>();

      if (rateLimitRecord && rateLimitRecord.lockout_until) {
        const lockoutTime = new Date(rateLimitRecord.lockout_until);
        if (lockoutTime > now) {
          const remainingMinutes = Math.ceil((lockoutTime.getTime() - now.getTime()) / 60000);
          return errorResponse(`Too many failed login attempts. Locked out for ${remainingMinutes} more minute(s).`, 429);
        }
      }

      const body = await request.json() as { username?: string; password?: string };
      if (!body.username || !body.password) {
        return errorResponse('Username and password are required', 400);
      }

      const username = body.username.trim().toLowerCase();
      const owner = await env.DB.prepare(
        'SELECT * FROM owner_accounts WHERE username = ?'
      ).bind(username).first<OwnerAccount>();

      const isValid = owner ? await verifyPassword(body.password, owner.password_hash, owner.salt) : false;

      if (!isValid) {
        // Record failed attempt
        const currentAttempts = (rateLimitRecord?.failed_attempts || 0) + 1;
        let lockoutUntil = null;
        if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
          lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        }

        await env.DB.prepare(`
          INSERT INTO auth_rate_limits (key, failed_attempts, lockout_until, last_attempt)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            failed_attempts = excluded.failed_attempts,
            lockout_until = excluded.lockout_until,
            last_attempt = excluded.last_attempt
        `).bind(rateLimitKey, currentAttempts, lockoutUntil, now.toISOString()).run();

        const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - currentAttempts);
        return errorResponse(
          remaining > 0
            ? `Invalid username or password. ${remaining} attempt(s) remaining before lockout.`
            : `Too many failed attempts. Account locked out for 15 minutes.`,
          401
        );
      }

      // Success: clear rate limit
      await env.DB.prepare('DELETE FROM auth_rate_limits WHERE key = ?').bind(rateLimitKey).run();

      // Update last login
      await env.DB.prepare(
        'UPDATE owner_accounts SET last_login_at = ? WHERE id = ?'
      ).bind(now.toISOString(), owner!.id).run();

      // Create new session
      const rawSessionToken = generateSecureToken(32);
      const tokenHash = await sha256(rawSessionToken);
      const sessionId = generateId('sess');
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

      await env.DB.prepare(`
        INSERT INTO sessions (id, token_hash, owner_id, expires_at, created_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(sessionId, tokenHash, owner!.id, expiresAt, now.toISOString(), request.headers.get('User-Agent') || '', clientIp).run();

      const csrfToken = generateSecureToken(16);

      return jsonResponse({
        success: true,
        user: { id: owner!.id, username: owner!.username },
        csrfToken
      }, 200, {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${rawSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}`
      });
    }

    if (path === '/auth/logout' && method === 'POST') {
      const sessionToken = getCookie(request, SESSION_COOKIE_NAME);
      if (sessionToken) {
        const tokenHash = await sha256(sessionToken);
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
      }

      return jsonResponse({ success: true, message: 'Logged out' }, 200, {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
      });
    }

    if (path === '/auth/me' && method === 'GET') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) {
        return jsonResponse({ authenticated: false });
      }
      return jsonResponse({
        authenticated: true,
        user: { id: auth.owner.id, username: auth.owner.username, last_login_at: auth.owner.last_login_at }
      });
    }

    // ----------------------------------------------------
    // 7. IMAGE UPLOADS (R2 OR FALLBACK STORE)
    // ----------------------------------------------------
    if (path === '/upload' && method === 'POST') {
      const auth = await getAuthenticatedOwner(request, env);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!(await verifyCsrf(request))) return errorResponse('Invalid CSRF token', 403);

      const contentType = request.headers.get('Content-Type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return errorResponse('Content-Type must be multipart/form-data', 400);
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string' || !(file instanceof Blob)) {
        return errorResponse('Valid image file is required', 400);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return errorResponse('Invalid image format. Allowed formats: JPG, PNG, WebP.', 400);
      }

      // Validate file size: max 4MB
      const MAX_SIZE = 4 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return errorResponse('Image file size exceeds 4MB limit.', 400);
      }

      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const key = `img_${Date.now()}_${generateSecureToken(4)}.${ext}`;

      if (env.IMAGES && typeof env.IMAGES.put === 'function') {
        // Upload to Cloudflare R2 bucket
        await env.IMAGES.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });
        const url = `/api/images/${key}`;
        return jsonResponse({ url, key });
      } else {
        // Cloudflare R2 not bound in local preview; convert to data URI so image updates work immediately
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${file.type};base64,${base64}`;
        return jsonResponse({ url: dataUrl, key });
      }
    }

    if (path.startsWith('/images/') && method === 'GET') {
      const key = path.split('/')[2];
      if (!key) return errorResponse('Image key required', 400);

      if (env.IMAGES && typeof env.IMAGES.get === 'function') {
        const object = await env.IMAGES.get(key);
        if (!object) return errorResponse('Image not found in R2', 404);

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        return new Response(object.body, { headers });
      }

      return errorResponse('R2 images not configured on this host', 404);
    }

    return errorResponse(`Endpoint not found: ${method} ${path}`, 404);
  } catch (err: any) {
    console.error('API Error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
}

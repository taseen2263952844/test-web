/**
 * D1 Database Emulator for Development
 * Provides a 100% API-compliant D1Database interface for local Vite dev mode
 * and preview environments, matching Cloudflare's runtime behavior.
 */

import type { D1Database, D1PreparedStatement, D1Result } from './types.ts';
import { initialSettings, initialCategories, initialMenuItems } from './seed-defaults.ts';

interface TableStore {
  restaurant_settings: Map<string, any>;
  menu_categories: Map<string, any>;
  menu_items: Map<string, any>;
  orders: Map<string, any>;
  order_items: Map<string, any>;
  owner_accounts: Map<string, any>;
  sessions: Map<string, any>;
  auth_rate_limits: Map<string, any>;
}

class InMemoryD1Store {
  tables: TableStore = {
    restaurant_settings: new Map(),
    menu_categories: new Map(),
    menu_items: new Map(),
    orders: new Map(),
    order_items: new Map(),
    owner_accounts: new Map(),
    sessions: new Map(),
    auth_rate_limits: new Map(),
  };

  private initialized = false;

  constructor() {
    this.seed();
  }

  seed() {
    if (this.initialized) return;
    this.initialized = true;

    // Seed default settings
    this.tables.restaurant_settings.set('default', { ...initialSettings });

    // Seed categories
    for (const cat of initialCategories) {
      this.tables.menu_categories.set(cat.id, { ...cat });
    }

    // Seed menu items
    for (const item of initialMenuItems) {
      this.tables.menu_items.set(item.id, { ...item });
    }
  }

  reset() {
    this.initialized = false;
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
    this.seed();
  }
}

// Global singleton in memory
const globalStore = new InMemoryD1Store();

export function createD1Emulator(): D1Database {
  return {
    prepare(query: string): D1PreparedStatement {
      return new EmulatorPreparedStatement(query, [], globalStore);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      for (const stmt of statements) {
        results.push(await stmt.run() as D1Result<T>);
      }
      return results;
    },
    async exec(query: string): Promise<D1Result> {
      // Basic runner for migration scripts
      return { success: true };
    }
  };
}

class EmulatorPreparedStatement implements D1PreparedStatement {
  private query: string;
  private params: unknown[];
  private store: InMemoryD1Store;

  constructor(query: string, params: unknown[], store: InMemoryD1Store) {
    this.query = query.trim();
    this.params = params;
    this.store = store;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new EmulatorPreparedStatement(this.query, values, this.store);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const res = await this.all<T>();
    if (!res.results || res.results.length === 0) return null;
    const firstRow = res.results[0];
    if (colName && typeof firstRow === 'object' && firstRow !== null) {
      return (firstRow as any)[colName] ?? null;
    }
    return firstRow;
  }

  async run(): Promise<D1Result> {
    const res = await this.execute();
    return { success: true, meta: { changes: res.changes } };
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const res = await this.execute();
    return { success: true, results: (res.rows || []) as T[] };
  }

  private async execute(): Promise<{ rows?: any[]; changes?: number }> {
    const sql = this.query.replace(/\s+/g, ' ').trim();
    const upper = sql.toUpperCase();
    const p = [...this.params];

    // 1. SELECT COUNT(*) as count FROM owner_accounts
    if (upper.includes('FROM OWNER_ACCOUNTS') && upper.includes('COUNT(')) {
      const count = this.store.tables.owner_accounts.size;
      return { rows: [{ count, 'COUNT(*)': count }] };
    }

    // 2. SELECT * FROM owner_accounts WHERE username = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM OWNER_ACCOUNTS')) {
      if (upper.includes('WHERE USERNAME = ?')) {
        const username = p[0];
        const match = Array.from(this.store.tables.owner_accounts.values()).find(u => u.username === username);
        return { rows: match ? [{ ...match }] : [] };
      }
      if (upper.includes('WHERE ID = ?')) {
        const id = p[0];
        const match = this.store.tables.owner_accounts.get(String(id));
        return { rows: match ? [{ ...match }] : [] };
      }
      return { rows: Array.from(this.store.tables.owner_accounts.values()) };
    }

    // 3. INSERT INTO owner_accounts
    if (upper.startsWith('INSERT INTO OWNER_ACCOUNTS')) {
      const [id, username, password_hash, salt, created_at, last_login_at] = p;
      const account = { id, username, password_hash, salt, created_at: created_at || new Date().toISOString(), last_login_at };
      this.store.tables.owner_accounts.set(String(id), account);
      return { changes: 1 };
    }

    // 4. UPDATE owner_accounts SET last_login_at = ? WHERE id = ?
    if (upper.startsWith('UPDATE OWNER_ACCOUNTS')) {
      const [last_login_at, id] = p;
      const account = this.store.tables.owner_accounts.get(String(id));
      if (account) {
        account.last_login_at = last_login_at;
      }
      return { changes: 1 };
    }

    // 5. SESSIONS
    if (upper.startsWith('INSERT INTO SESSIONS')) {
      const [id, token_hash, owner_id, expires_at, created_at, user_agent, ip_address] = p;
      const session = { id, token_hash, owner_id, expires_at, created_at: created_at || new Date().toISOString(), user_agent, ip_address };
      this.store.tables.sessions.set(String(token_hash), session);
      return { changes: 1 };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM SESSIONS')) {
      if (upper.includes('WHERE TOKEN_HASH = ?')) {
        const tokenHash = String(p[0]);
        const session = this.store.tables.sessions.get(tokenHash);
        if (!session) return { rows: [] };
        if (p.length > 1 && new Date(session.expires_at).getTime() <= new Date(String(p[1])).getTime()) {
          this.store.tables.sessions.delete(tokenHash);
          return { rows: [] };
        }
        return { rows: [{ ...session }] };
      }
    }

    if (upper.startsWith('DELETE FROM SESSIONS WHERE TOKEN_HASH = ?')) {
      const tokenHash = String(p[0]);
      this.store.tables.sessions.delete(tokenHash);
      return { changes: 1 };
    }

    // 6. RESTAURANT SETTINGS
    if (upper.startsWith('SELECT') && upper.includes('FROM RESTAURANT_SETTINGS')) {
      const settings = this.store.tables.restaurant_settings.get('default') || { ...initialSettings };
      return { rows: [{ ...settings }] };
    }

    if (upper.startsWith('UPDATE RESTAURANT_SETTINGS')) {
      const settings = this.store.tables.restaurant_settings.get('default') || { ...initialSettings };
      // Standard update: SET name=?, tagline=?, description=?, logo_url=?, hero_url=?, address=?, phone=?, email=?, currency=?, delivery_enabled=?, pickup_enabled=?, delivery_charge=?, min_order_amount=?, free_delivery_threshold=?, opening_hours=?, updated_at=? WHERE id = 'default'
      if (p.length >= 15) {
        settings.name = p[0] ?? settings.name;
        settings.tagline = p[1] ?? settings.tagline;
        settings.description = p[2] ?? settings.description;
        settings.logo_url = p[3] ?? settings.logo_url;
        settings.hero_url = p[4] ?? settings.hero_url;
        settings.address = p[5] ?? settings.address;
        settings.phone = p[6] ?? settings.phone;
        settings.email = p[7] ?? settings.email;
        settings.currency = p[8] ?? settings.currency;
        settings.delivery_enabled = Number(p[9]);
        settings.pickup_enabled = Number(p[10]);
        settings.delivery_charge = Number(p[11]);
        settings.min_order_amount = Number(p[12]);
        settings.free_delivery_threshold = Number(p[13]);
        settings.opening_hours = p[14] ?? settings.opening_hours;
        settings.updated_at = new Date().toISOString();
      }
      this.store.tables.restaurant_settings.set('default', settings);
      return { changes: 1 };
    }

    // 7. MENU CATEGORIES
    if (upper.startsWith('SELECT') && upper.includes('FROM MENU_CATEGORIES')) {
      let cats = Array.from(this.store.tables.menu_categories.values());
      if (upper.includes('WHERE ID = ?')) {
        const match = this.store.tables.menu_categories.get(String(p[0]));
        return { rows: match ? [{ ...match }] : [] };
      }
      if (upper.includes('WHERE IS_ACTIVE = 1')) {
        cats = cats.filter(c => c.is_active === 1);
      }
      cats.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return { rows: cats.map(c => ({ ...c })) };
    }

    if (upper.startsWith('INSERT INTO MENU_CATEGORIES')) {
      const [id, name, slug, display_order, is_active, created_at, updated_at] = p;
      const cat = {
        id: String(id),
        name: String(name),
        slug: String(slug),
        display_order: Number(display_order || 0),
        is_active: Number(is_active ?? 1),
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString()
      };
      this.store.tables.menu_categories.set(cat.id, cat);
      return { changes: 1 };
    }

    if (upper.startsWith('UPDATE MENU_CATEGORIES SET')) {
      // SET name=?, slug=?, display_order=?, is_active=?, updated_at=? WHERE id=?
      const [name, slug, display_order, is_active, updated_at, id] = p;
      const cat = this.store.tables.menu_categories.get(String(id));
      if (cat) {
        cat.name = String(name);
        cat.slug = String(slug);
        cat.display_order = Number(display_order);
        cat.is_active = Number(is_active);
        cat.updated_at = String(updated_at || new Date().toISOString());
      }
      return { changes: 1 };
    }

    if (upper.startsWith('DELETE FROM MENU_CATEGORIES WHERE ID = ?')) {
      const id = String(p[0]);
      this.store.tables.menu_categories.delete(id);
      return { changes: 1 };
    }

    // 8. MENU ITEMS
    if (upper.startsWith('SELECT') && upper.includes('FROM MENU_ITEMS')) {
      let items = Array.from(this.store.tables.menu_items.values());
      if (upper.includes('WHERE ID = ?')) {
        const match = this.store.tables.menu_items.get(String(p[0]));
        return { rows: match ? [{ ...match }] : [] };
      }
      if (upper.includes('WHERE IS_ACTIVE = 1')) {
        items = items.filter(i => i.is_active === 1);
      }
      items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return { rows: items.map(i => ({ ...i })) };
    }

    if (upper.startsWith('INSERT INTO MENU_ITEMS')) {
      const [id, category_id, name, slug, description, price, image_url, is_active, is_available, dietary_flags, sort_order, created_at, updated_at] = p;
      const item = {
        id: String(id),
        category_id: String(category_id),
        name: String(name),
        slug: String(slug),
        description: String(description || ''),
        price: Number(price),
        image_url: image_url ? String(image_url) : null,
        is_active: Number(is_active ?? 1),
        is_available: Number(is_available ?? 1),
        dietary_flags: String(dietary_flags || ''),
        sort_order: Number(sort_order || 0),
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString()
      };
      this.store.tables.menu_items.set(item.id, item);
      return { changes: 1 };
    }

    if (upper.startsWith('UPDATE MENU_ITEMS SET')) {
      // Can be availability toggle or full update
      if (upper.includes('IS_AVAILABLE = ?') && p.length === 3) {
        // UPDATE menu_items SET is_available = ?, updated_at = ? WHERE id = ?
        const [is_available, updated_at, id] = p;
        const item = this.store.tables.menu_items.get(String(id));
        if (item) {
          item.is_available = Number(is_available);
          item.updated_at = String(updated_at || new Date().toISOString());
        }
        return { changes: 1 };
      }
      if (upper.includes('IS_ACTIVE = ?') && p.length === 3) {
        // UPDATE menu_items SET is_active = ?, updated_at = ? WHERE id = ?
        const [is_active, updated_at, id] = p;
        const item = this.store.tables.menu_items.get(String(id));
        if (item) {
          item.is_active = Number(is_active);
          item.updated_at = String(updated_at || new Date().toISOString());
        }
        return { changes: 1 };
      }
      // Full update
      // SET category_id=?, name=?, slug=?, description=?, price=?, image_url=?, is_active=?, is_available=?, dietary_flags=?, sort_order=?, updated_at=? WHERE id=?
      const [category_id, name, slug, description, price, image_url, is_active, is_available, dietary_flags, sort_order, updated_at, id] = p;
      const item = this.store.tables.menu_items.get(String(id));
      if (item) {
        item.category_id = String(category_id);
        item.name = String(name);
        item.slug = String(slug);
        item.description = String(description || '');
        item.price = Number(price);
        item.image_url = image_url ? String(image_url) : null;
        item.is_active = Number(is_active);
        item.is_available = Number(is_available);
        item.dietary_flags = String(dietary_flags || '');
        item.sort_order = Number(sort_order || 0);
        item.updated_at = String(updated_at || new Date().toISOString());
      }
      return { changes: 1 };
    }

    if (upper.startsWith('DELETE FROM MENU_ITEMS WHERE ID = ?')) {
      const id = String(p[0]);
      this.store.tables.menu_items.delete(id);
      return { changes: 1 };
    }

    // 9. ORDERS
    if (upper.startsWith('SELECT') && upper.includes('FROM ORDERS')) {
      let orders = Array.from(this.store.tables.orders.values());
      if (upper.includes('WHERE ID = ?')) {
        const match = this.store.tables.orders.get(String(p[0]));
        return { rows: match ? [{ ...match }] : [] };
      }
      if (upper.includes('WHERE ORDER_NUMBER = ?')) {
        const match = orders.find(o => o.order_number === String(p[0]));
        return { rows: match ? [{ ...match }] : [] };
      }
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { rows: orders.map(o => ({ ...o })) };
    }

    if (upper.startsWith('INSERT INTO ORDERS')) {
      const [id, order_number, order_type, customer_name, customer_phone, customer_email, delivery_address, order_notes, subtotal, delivery_charge, total, status, payment_method, payment_status, created_at, updated_at] = p;
      const order = {
        id: String(id),
        order_number: String(order_number),
        order_type: String(order_type),
        customer_name: String(customer_name),
        customer_phone: String(customer_phone),
        customer_email: customer_email ? String(customer_email) : null,
        delivery_address: delivery_address ? String(delivery_address) : null,
        order_notes: order_notes ? String(order_notes) : null,
        subtotal: Number(subtotal),
        delivery_charge: Number(delivery_charge),
        total: Number(total),
        status: String(status || 'received'),
        payment_method: String(payment_method),
        payment_status: String(payment_status || 'pending'),
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString()
      };
      this.store.tables.orders.set(order.id, order);
      return { changes: 1 };
    }

    if (upper.startsWith('UPDATE ORDERS SET STATUS = ?')) {
      // UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
      const [status, updated_at, id] = p;
      const order = this.store.tables.orders.get(String(id));
      if (order) {
        order.status = String(status);
        order.updated_at = String(updated_at || new Date().toISOString());
      }
      return { changes: 1 };
    }

    // 10. ORDER ITEMS
    if (upper.startsWith('SELECT') && upper.includes('FROM ORDER_ITEMS')) {
      let items = Array.from(this.store.tables.order_items.values());
      if (upper.includes('WHERE ORDER_ID = ?')) {
        const orderId = String(p[0]);
        items = items.filter(i => i.order_id === orderId);
      }
      return { rows: items.map(i => ({ ...i })) };
    }

    if (upper.startsWith('INSERT INTO ORDER_ITEMS')) {
      const [id, order_id, menu_item_id, item_name, unit_price, quantity, total_price, notes, created_at] = p;
      const orderItem = {
        id: String(id),
        order_id: String(order_id),
        menu_item_id: menu_item_id ? String(menu_item_id) : null,
        item_name: String(item_name),
        unit_price: Number(unit_price),
        quantity: Number(quantity),
        total_price: Number(total_price),
        notes: notes ? String(notes) : null,
        created_at: created_at || new Date().toISOString()
      };
      this.store.tables.order_items.set(orderItem.id, orderItem);
      return { changes: 1 };
    }

    // 11. RATE LIMITS
    if (upper.startsWith('SELECT') && upper.includes('FROM AUTH_RATE_LIMITS')) {
      const key = String(p[0]);
      const record = this.store.tables.auth_rate_limits.get(key);
      return { rows: record ? [{ ...record }] : [] };
    }

    if (upper.startsWith('INSERT INTO AUTH_RATE_LIMITS') || upper.startsWith('INSERT OR REPLACE INTO AUTH_RATE_LIMITS')) {
      const [key, failed_attempts, lockout_until, last_attempt] = p;
      this.store.tables.auth_rate_limits.set(String(key), {
        key: String(key),
        failed_attempts: Number(failed_attempts),
        lockout_until: lockout_until ? String(lockout_until) : null,
        last_attempt: String(last_attempt || new Date().toISOString())
      });
      return { changes: 1 };
    }

    if (upper.startsWith('DELETE FROM AUTH_RATE_LIMITS WHERE KEY = ?')) {
      this.store.tables.auth_rate_limits.delete(String(p[0]));
      return { changes: 1 };
    }

    return { rows: [], changes: 0 };
  }
}

/**
 * Cloudflare Workers & Application Types
 */

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  writeHttpMetadata(headers: Headers): void;
  body: ReadableStream;
}

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: Record<string, unknown>): Promise<R2Object>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: D1Database;
  IMAGES?: R2Bucket;
  BOOTSTRAP_SECRET?: string;
  ENVIRONMENT?: string;
  [key: string]: unknown;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
  hero_url: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  delivery_enabled: number;
  pickup_enabled: number;
  delivery_charge: number;
  min_order_amount: number;
  free_delivery_threshold: number;
  opening_hours: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: number;
  is_available: number;
  dietary_flags: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type OrderType = 'delivery' | 'pickup';
export type OrderStatus = 'received' | 'preparing' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'pay_at_pickup';
export type PaymentStatus = 'pending' | 'paid';

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address?: string | null;
  order_notes?: string | null;
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string | null;
  created_at?: string;
}

export interface OwnerAccount {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
  last_login_at?: string | null;
}

export interface Session {
  id: string;
  token_hash: string;
  owner_id: string;
  expires_at: string;
  created_at: string;
  user_agent?: string | null;
  ip_address?: string | null;
}

export interface CreateOrderPayload {
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  order_notes?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    notes?: string;
  }>;
}

-- Cloudflare D1 Migration: 0001_initial_schema.sql
-- Production D1 Schema for Restaurant Starter

-- 1. Restaurant Settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'The Heritage English Kitchen',
  tagline TEXT NOT NULL DEFAULT 'Hearty Artisan British Fare & Seasonal Comforts',
  description TEXT NOT NULL DEFAULT 'Rooted in heritage English pub dining, we serve line-caught coastal fish, dry-aged British steaks, and timeless seasonal classics crafted with locally harvested produce.',
  logo_url TEXT DEFAULT '',
  hero_url TEXT DEFAULT '',
  address TEXT NOT NULL DEFAULT '14 High Street, Winchester, Hampshire, SO23 9JX',
  phone TEXT NOT NULL DEFAULT '+44 1962 841234',
  email TEXT NOT NULL DEFAULT 'orders@heritagekitchen.co.uk',
  currency TEXT NOT NULL DEFAULT '£',
  delivery_enabled INTEGER NOT NULL DEFAULT 1,
  pickup_enabled INTEGER NOT NULL DEFAULT 1,
  delivery_charge REAL NOT NULL DEFAULT 3.50,
  min_order_amount REAL NOT NULL DEFAULT 15.00,
  free_delivery_threshold REAL DEFAULT 40.00,
  opening_hours TEXT NOT NULL DEFAULT 'Mon-Fri: 12:00 - 22:00, Sat-Sun: 11:30 - 22:30',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_available INTEGER NOT NULL DEFAULT 1,
  dietary_flags TEXT DEFAULT '', -- JSON or comma-separated e.g. "Vegetarian,Gluten-Free"
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active_available ON menu_items(is_active, is_available);

-- 4. Owner Accounts
CREATE TABLE IF NOT EXISTS owner_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- 5. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  FOREIGN KEY (owner_id) REFERENCES owner_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL CHECK(order_type IN ('delivery', 'pickup')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  order_notes TEXT,
  subtotal REAL NOT NULL,
  delivery_charge REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash_on_delivery', 'pay_at_pickup')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 7. Order Items (Snapshot table preserving item name and price at checkout time)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  menu_item_id TEXT,
  item_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  total_price REAL NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 8. Brute-force & Rate Limiting table
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY, -- IP or identifier
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until DATETIME,
  last_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

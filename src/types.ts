/**
 * Frontend Client Types
 */

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
  updated_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: number;
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
}

export type OrderType = 'delivery' | 'pickup';
export type OrderStatus = 'received' | 'preparing' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'pay_at_pickup';

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
}

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
  payment_status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

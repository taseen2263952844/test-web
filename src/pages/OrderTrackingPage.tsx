import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Search, Clock, CheckCircle2, Truck, ShoppingBag, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus } from '../types.ts';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'received', label: 'Order Received', desc: 'Sent to the kitchen display' },
  { key: 'preparing', label: 'In the Kitchen', desc: 'Our chefs are cooking your meal' },
  { key: 'out_for_delivery', label: 'Out for Handover', desc: 'On its way to your doorstep or ready at bar' },
  { key: 'completed', label: 'Completed', desc: 'Delivered or collected safely' }
];

export const OrderTrackingPage: React.FC = () => {
  const { trackingOrderNumber, setTrackingOrderNumber, settings } = useApp();
  const [searchInput, setSearchInput] = useState(trackingOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const currency = settings?.currency || '£';

  // Load recent orders from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rs_recent_orders') || '[]');
      setRecentOrders(saved);
    } catch {}
  }, []);

  const fetchOrder = useCallback(async (orderNum: string) => {
    if (!orderNum.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(orderNum.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please check your order number.');
      }

      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve order details.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch immediately if trackingOrderNumber is set
  useEffect(() => {
    if (trackingOrderNumber) {
      setSearchInput(trackingOrderNumber);
      fetchOrder(trackingOrderNumber);
    }
  }, [trackingOrderNumber, fetchOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setTrackingOrderNumber(searchInput.trim());
    fetchOrder(searchInput.trim());
  };

  const getStepState = (stepIndex: number, currentStatus: OrderStatus) => {
    if (currentStatus === 'cancelled') return 'cancelled';

    let currentStepIndex = 0;
    if (currentStatus === 'received') currentStepIndex = 0;
    else if (currentStatus === 'preparing') currentStepIndex = 1;
    else if (currentStatus === 'out_for_delivery' || currentStatus === 'ready_for_pickup') currentStepIndex = 2;
    else if (currentStatus === 'completed') currentStepIndex = 3;

    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Title */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
          Real-Time Kitchen Dispatch
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
          Track Your Order
        </h1>
        <p className="text-sm text-stone-600">
          Enter your order reference code (e.g. <code>RS-20261021-1234</code>) below to monitor preparation and delivery.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="e.g. RS-20261021-..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Tracking Card */}
      {order && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="bg-stone-900 text-stone-100 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                  {order.order_type === 'delivery' ? 'Home Delivery' : 'Pickup Collection'}
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-xs text-stone-400">
                  Placed {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-amber-50 mt-1">
                {order.order_number}
              </h2>
            </div>

            <button
              onClick={() => fetchOrder(order.order_number)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 font-medium rounded-lg transition-colors w-fit cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Status Stepper */}
          <div className="p-6 sm:p-8 border-b border-stone-200 bg-stone-50/60">
            {order.status === 'cancelled' ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold">Order Cancelled</div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    This order was cancelled by the restaurant or customer.
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepState(idx, order.status);
                  // Adjust label for pickup
                  let label = step.label;
                  if (idx === 2 && order.order_type === 'pickup') {
                    label = 'Ready for Pickup';
                  }

                  return (
                    <div
                      key={step.key}
                      className={`relative p-3.5 rounded-xl border transition-all ${
                        state === 'current'
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                          : state === 'complete'
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                          : 'bg-white border-stone-200 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {state === 'complete' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : state === 'current' ? (
                          <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-400">
                            {idx + 1}
                          </div>
                        )}
                        <span className={`text-xs font-bold ${
                          state === 'current' ? 'text-amber-900' : state === 'complete' ? 'text-emerald-950' : 'text-stone-500'
                        }`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-[11px] leading-tight text-stone-500">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Details & Summary */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Ordered Items */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Items In This Order
              </h3>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-stone-800">
                        <span className="text-amber-800 font-bold mr-1.5">{item.quantity}×</span>
                        {item.item_name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-amber-900 italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                    <span className="font-semibold tabular-nums text-stone-900 shrink-0">
                      {currency}{item.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium tabular-nums text-stone-900">{currency}{order.subtotal.toFixed(2)}</span>
                </div>
                {order.order_type === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-medium tabular-nums text-stone-900">
                      {order.delivery_charge === 0 ? 'FREE' : `${currency}${order.delivery_charge.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-amber-800 tabular-nums">{currency}{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer & Handover info */}
            <div className="space-y-4 bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Handover &amp; Payment Details
              </h3>

              <div className="space-y-2.5 text-xs text-stone-700">
                <div>
                  <span className="text-stone-500 block">Customer Name:</span>
                  <span className="font-semibold text-stone-900 text-sm">{order.customer_name}</span>
                </div>

                <div>
                  <span className="text-stone-500 block">Phone:</span>
                  <span className="font-medium text-stone-900">{order.customer_phone}</span>
                </div>

                {order.order_type === 'delivery' && (
                  <div>
                    <span className="text-stone-500 block">Delivery Address:</span>
                    <span className="font-medium text-stone-900 whitespace-pre-line">{order.delivery_address}</span>
                  </div>
                )}

                {order.order_notes && (
                  <div>
                    <span className="text-stone-500 block">Order Notes:</span>
                    <span className="text-stone-800 italic">{order.order_notes}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 block">Payment Method:</span>
                  <span className="font-semibold text-amber-900">
                    {order.payment_method === 'cash_on_delivery'
                      ? 'Cash on Delivery (Please prepare cash for driver)'
                      : 'Pay at Pickup (Cash or Card accepted at counter)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Recent Orders List (from localStorage) */}
      {recentOrders.length > 0 && !order && (
        <div className="max-w-xl mx-auto space-y-3 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Your Recent Orders
          </h3>
          <div className="divide-y divide-stone-200 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            {recentOrders.map((rec) => (
              <button
                key={rec.order_number}
                onClick={() => {
                  setSearchInput(rec.order_number);
                  fetchOrder(rec.order_number);
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="font-mono font-bold text-sm text-stone-900 group-hover:text-amber-800 transition-colors">
                    {rec.order_number}
                  </div>
                  <div className="text-xs text-stone-500">
                    {rec.order_type === 'delivery' ? 'Home Delivery' : 'Pickup'} · {new Date(rec.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold tabular-nums text-stone-800">
                    {currency}{rec.total.toFixed(2)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

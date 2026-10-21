import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, Trash2, Plus, Minus, Truck, ShoppingBag, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Order } from '../types.ts';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    orderType,
    setOrderType,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    settings,
    setActivePage,
    setTrackingOrderNumber,
    showToast
  } = useApp();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const currency = settings?.currency || '£';
  const minOrderAmount = settings?.min_order_amount || 0;
  const isBelowMin = orderType === 'delivery' && minOrderAmount > 0 && cartSubtotal < minOrderAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) {
      setFormError('Your basket is empty. Please select dishes from the menu.');
      return;
    }

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 7) {
      setFormError('Please provide a valid contact telephone number.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Delivery address is required for home delivery orders.');
      return;
    }

    if (isBelowMin) {
      setFormError(`Minimum order subtotal for delivery is ${currency}${minOrderAmount.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        order_type: orderType,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        order_notes: orderNotes.trim() || undefined,
        items: cart.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes || undefined
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const order: Order = data.order;
      showToast(`Order #${order.order_number} confirmed!`, 'success');
      
      // Save order number to localStorage recent orders
      try {
        const recents = JSON.parse(localStorage.getItem('rs_recent_orders') || '[]');
        recents.unshift({
          order_number: order.order_number,
          total: order.total,
          created_at: order.created_at,
          order_type: order.order_type
        });
        localStorage.setItem('rs_recent_orders', JSON.stringify(recents.slice(0, 10)));
      } catch {}

      clearCart();
      setIsCartOpen(false);
      setTrackingOrderNumber(order.order_number);
      setActivePage('track');
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while submitting your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-serif font-bold text-stone-900">Your Basket</h2>
            <span className="text-xs text-stone-500 font-medium">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close basket"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-stone-800">Your basket is empty</h3>
              <p className="text-sm text-stone-500 max-w-xs mx-auto">
                Explore our selection of traditional British dishes, burgers, and puddings.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActivePage('menu');
                }}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-semibold rounded-lg transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Delivery / Pickup Segmented Control */}
              <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200">
                {settings?.delivery_enabled === 1 && (
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      orderType === 'delivery'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Home Delivery</span>
                  </button>
                )}
                {settings?.pickup_enabled === 1 && (
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      orderType === 'pickup'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Pay at Pickup</span>
                  </button>
                )}
              </div>

              {/* Free delivery threshold indicator */}
              {orderType === 'delivery' && settings && settings.free_delivery_threshold > 0 && (
                <div className="text-xs bg-amber-50 border border-amber-200/80 p-3 rounded-lg text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {cartSubtotal >= settings.free_delivery_threshold ? (
                      <span className="font-semibold text-emerald-800">You have qualified for Free Delivery!</span>
                    ) : (
                      <span>
                        Add <strong>{currency}{(settings.free_delivery_threshold - cartSubtotal).toFixed(2)}</strong> more to unlock Free Delivery
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-stone-100 border-y border-stone-100">
                {cart.map((item) => (
                  <div key={item.menuItem.id + (item.notes || '')} className="py-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold text-stone-900 truncate">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-sm font-semibold tabular-nums text-stone-900 shrink-0">
                          {currency}{(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 tabular-nums">
                        {currency}{item.menuItem.price.toFixed(2)} each
                      </p>
                      {item.notes && (
                        <p className="text-xs text-amber-800 italic mt-0.5 truncate">
                          Note: "{item.notes}"
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-stone-200 rounded-md bg-stone-50">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1)}
                            className="p-1 text-stone-600 hover:text-stone-900 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1)}
                            className="p-1 text-stone-600 hover:text-stone-900 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 text-xs transition-colors ml-auto flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Customer &amp; Handover Details
                </h3>

                {formError && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-stone-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 07911 123456"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-stone-900 text-sm"
                    />
                    <span className="text-[11px] text-stone-500">
                      Required for order confirmation and handover.
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. eleanor@example.co.uk"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-stone-900 text-sm"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <div>
                      <label className="block text-stone-700 font-medium mb-1">
                        Delivery Address &amp; Postcode <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="House / Flat #, Street Name, Town, Postcode"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-stone-900 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Order Notes / Dietary Requests
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please ring front bell, cutlery please"
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-stone-900 text-sm"
                    />
                  </div>
                </div>

                {/* Payment Notice */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-xs text-stone-600 space-y-1">
                  <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <span>Payment Method:</span>
                    <span className="text-amber-800">
                      {orderType === 'delivery' ? 'Cash on Delivery (COD)' : 'Pay at Pickup (Cash / Card)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {orderType === 'delivery'
                      ? 'Please have exact cash or payment ready when the driver arrives at your doorstep.'
                      : 'Payment is settled at the bar or counter upon collection.'}
                  </p>
                </div>
              </form>
            </>
          )}

        </div>

        {/* Footer Totals & Submit */}
        {cart.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50 p-6 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums text-stone-900">{currency}{cartSubtotal.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    {cartDeliveryFee === 0 ? 'FREE' : `${currency}${cartDeliveryFee.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Due</span>
                <span className="text-amber-800 tabular-nums">{currency}{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {isBelowMin && (
              <p className="text-xs text-rose-600 font-medium">
                * Minimum subtotal of {currency}{minOrderAmount.toFixed(2)} required for home delivery.
              </p>
            )}

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting || isBelowMin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold text-sm rounded-lg shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <span>Confirming Order with Kitchen...</span>
              ) : (
                <>
                  <span>
                    Confirm {orderType === 'delivery' ? 'Delivery Order' : 'Pickup Order'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

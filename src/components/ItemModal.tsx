import React, { useState } from 'react';
import type { MenuItem } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { X, Plus, Minus, ShoppingBag, Utensils } from 'lucide-react';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  const { addToCart, settings, setIsCartOpen } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const currency = settings?.currency || '£';
  const totalPrice = (item.price * quantity).toFixed(2);

  const handleAdd = () => {
    addToCart(item, quantity, notes);
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] border border-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-20 p-2 bg-stone-900/60 hover:bg-stone-900 text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image Container with Fallback */}
        <div className="relative w-full h-56 sm:h-64 bg-stone-100 overflow-hidden shrink-0">
          {item.image_url && !imageError ? (
            <img
              src={item.image_url}
              alt={item.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-6 text-center">
              <Utensils className="w-12 h-12 mb-2 text-stone-300" />
              <span className="font-serif font-bold text-stone-600 text-base">{item.name}</span>
              <span className="text-xs text-stone-400 mt-1">Freshly prepared in our English kitchen</span>
            </div>
          )}

          {item.dietary_flags && (
            <div className="absolute bottom-3 left-3 bg-stone-900/85 backdrop-blur-xs text-amber-200 text-xs px-2.5 py-1 rounded font-medium">
              {item.dietary_flags}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                {item.name}
              </h3>
              <span className="font-serif text-lg sm:text-xl font-bold tabular-nums text-amber-800 shrink-0">
                {currency}{item.price.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Kitchen / Special Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Special Requests or Dietary Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Extra sauce on side, no onions, well-done"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
            />
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-stone-700">Quantity</span>
            <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-stone-600 hover:text-stone-900 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold tabular-nums text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-stone-600 hover:text-stone-900 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200">
          <button
            type="button"
            disabled={!item.is_available}
            onClick={handleAdd}
            className="w-full flex items-center justify-between py-3 px-5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{item.is_available ? 'Add to Basket' : 'Currently Sold Out'}</span>
            </div>
            {item.is_available && (
              <span className="tabular-nums font-extrabold">{currency}{totalPrice}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

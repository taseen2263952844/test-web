import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ArrowRight, Clock, MapPin, Truck, ShoppingBag, Utensils, Check } from 'lucide-react';
import { ItemModal } from '../components/ItemModal.tsx';
import type { MenuItem } from '../types.ts';

export const HomePage: React.FC = () => {
  const { settings, menuItems, setActivePage, addToCart, setIsCartOpen } = useApp();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  // Pick signature items for the featured showcase
  const featuredItems = menuItems.filter(item =>
    ['item_fish_chips', 'item_sunday_roast', 'item_heritage_burger', 'item_sticky_toffee'].includes(item.id) ||
    item.image_url
  ).slice(0, 4);

  const heroImage = settings?.hero_url || '/src/assets/images/hero_restaurant_dining_1792585735418.jpg';
  const currency = settings?.currency || '£';

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <span>Traditional English Tavern &amp; Kitchen</span>
                <span>·</span>
                <span>Est. Winchester</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-amber-50 leading-[1.1] text-balance">
                {settings?.tagline || 'Hearty Artisan British Fare & Seasonal Comforts'}
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
                {settings?.description || 'From line-caught ale-battered cod to 28-day aged sirloin roasts with towering Yorkshires, enjoy authentic pub gastronomy crafted with local British ingredients.'}
              </p>

              {/* Order Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setActivePage('menu')}
                  className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm sm:text-base rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Order Online Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActivePage('about')}
                  className="px-5 py-3.5 border border-stone-700 hover:border-amber-400/60 text-stone-300 hover:text-white font-medium text-sm sm:text-base rounded-xl transition-colors cursor-pointer"
                >
                  Our Story &amp; Sourcing
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-stone-800/80 flex flex-wrap items-center gap-6 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>
                    {settings?.delivery_enabled ? 'Home Delivery available' : 'Pickup only'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>Cash on Delivery &amp; Pay at Pickup</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-800 aspect-[16/10] bg-stone-800">
                {!heroImageError ? (
                  <img
                    src={heroImage}
                    alt={settings?.name || 'Restaurant Dining'}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
                    <Utensils className="w-16 h-16 text-amber-500/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-stone-200 bg-stone-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Kitchen Open: {settings?.opening_hours?.split('|')[0] || '12:00 - 22:00'}</span>
                  </div>
                  <div className="font-semibold text-amber-400">
                    Fresh orders dispatched daily
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Key Highlights Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs">
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-700" />
              <span>Artisan British Fare</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Every dish is freshly prepared to order using pasture-fed British beef, free-range eggs, and daily coastal catches.
            </p>
          </div>
          <div className="space-y-2 md:border-l md:border-stone-200 md:pl-6">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-700" />
              <span>Direct Doorstep Delivery</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Delivered piping hot across town. Order online with Cash on Delivery — pay nothing until your meal arrives.
            </p>
          </div>
          <div className="space-y-2 md:border-l md:border-stone-200 md:pl-6">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-700" />
              <span>Prompt Collection</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Prefer pickup? Order ahead and collect directly at the bar counter with zero waiting and easy payment.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured Signatures Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Kitchen Highlights
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Signature Dishes &amp; Classics
            </h2>
          </div>
          <button
            onClick={() => setActivePage('menu')}
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>Explore All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
            >
              <div
                onClick={() => setSelectedItem(item)}
                className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Utensils className="w-10 h-10 text-stone-300" />
                  </div>
                )}
                {item.dietary_flags && (
                  <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-amber-200 text-[11px] font-medium px-2 py-0.5 rounded">
                    {item.dietary_flags}
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      onClick={() => setSelectedItem(item)}
                      className="font-serif text-base font-bold text-stone-900 hover:text-amber-800 transition-colors cursor-pointer line-clamp-1"
                    >
                      {item.name}
                    </h3>
                    <span className="font-semibold tabular-nums text-stone-900 text-sm shrink-0">
                      {currency}{item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart(item);
                      setIsCartOpen(true);
                    }}
                    disabled={!item.is_available}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-stone-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{item.is_available ? 'Add to Basket' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Sourcing & Culinary Story Section */}
      <section className="bg-stone-900 text-stone-100 py-16 sm:py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Heritage British Gastronomy
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-amber-50 text-balance">
              Simple Ingredients, Honest Preparation, Timeless Comfort.
            </h2>
          </div>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto">
            We partner directly with Hampshire butchers, Cornish day-boats, and local vegetable growers. Whether you are ordering a Sunday roast dinner or our signature craft burger to your home, we hold every portion to genuine pub kitchen standards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
            <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Check className="w-4 h-4" />
                <span>Line-Caught Coastal Fish</span>
              </div>
              <p className="text-xs text-stone-400">
                Fresh cod and haddock battered in local Sussex craft ale and fried to crisp golden perfection.
              </p>
            </div>
            <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Check className="w-4 h-4" />
                <span>Dry-Aged British Beef</span>
              </div>
              <p className="text-xs text-stone-400">
                Sourced from native British cattle breeds and dry-aged for at least 28 days for rich depth of flavor.
              </p>
            </div>
            <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Check className="w-4 h-4" />
                <span>Freshly Baked Puddings</span>
              </div>
              <p className="text-xs text-stone-400">
                Warm sticky toffee pudding, seasonal bramley apple crumbles, and clotted cream delivered to your doorstep.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActivePage('menu')}
              className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              View Full Menu &amp; Order
            </button>
          </div>
        </div>
      </section>

      {/* Item Modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

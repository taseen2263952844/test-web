import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Search, ShoppingBag, Utensils, X, Check } from 'lucide-react';
import { ItemModal } from '../components/ItemModal.tsx';
import type { MenuItem } from '../types.ts';

export const MenuPage: React.FC = () => {
  const { categories, menuItems, settings, addToCart, setIsCartOpen } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const currency = settings?.currency || '£';

  // Dietary options extraction
  const dietaryOptions = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach(item => {
      if (item.dietary_flags) {
        item.dietary_flags.split(',').forEach(flag => {
          const trimmed = flag.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // 1. Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      // 3. Dietary tag filter
      if (selectedDietary !== 'all') {
        if (!item.dietary_flags || !item.dietary_flags.toLowerCase().includes(selectedDietary.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, selectedDietary]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header & Description */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
          Fresh From Our Kitchen
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900">
          Our Seasonal Menu
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
          Select your dishes below for direct home delivery or pay-at-pickup collection. All orders are cooked fresh upon receipt by our kitchen staff.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4 bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search our dishes by name or ingredient (e.g. cod, burger, roast, crumble)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Tabs (Segmented Buttons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-stone-950 shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>
          {categories.map(cat => {
            const count = menuItems.filter(i => i.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-stone-950 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Dietary Filters */}
        {dietaryOptions.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500 overflow-x-auto no-scrollbar">
            <span className="font-medium shrink-0">Dietary:</span>
            <button
              onClick={() => setSelectedDietary('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                selectedDietary === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All
            </button>
            {dietaryOptions.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedDietary(selectedDietary === tag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  selectedDietary === tag
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-800">No dishes match your filter</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            Try resetting your search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDietary('all');
            }}
            className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                !item.is_available ? 'opacity-85' : ''
              }`}
            >
              {/* Card Media Header */}
              <div
                onClick={() => setSelectedItem(item)}
                className="relative aspect-[16/10] bg-stone-100 overflow-hidden cursor-pointer group"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100 p-4">
                    <Utensils className="w-8 h-8 text-stone-300 mb-1" />
                    <span className="text-xs text-stone-400 font-medium">Prepared Fresh Daily</span>
                  </div>
                )}

                {item.dietary_flags && (
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-amber-200 text-xs px-2.5 py-1 rounded font-medium">
                    {item.dietary_flags}
                  </div>
                )}

                {!item.is_available && (
                  <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-stone-900 text-amber-300 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border border-stone-700">
                      Sold Out Today
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      onClick={() => setSelectedItem(item)}
                      className="font-serif text-lg font-bold text-stone-900 hover:text-amber-800 transition-colors cursor-pointer leading-snug"
                    >
                      {item.name}
                    </h3>
                    <span className="font-serif text-base font-bold tabular-nums text-amber-800 shrink-0">
                      {currency}{item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 py-2 px-3 border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    View Details &amp; Notes
                  </button>
                  <button
                    type="button"
                    disabled={!item.is_available}
                    onClick={() => {
                      addToCart(item);
                      setIsCartOpen(true);
                    }}
                    className="py-2 px-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-stone-950 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{item.is_available ? 'Add' : 'Unavailable'}</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

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

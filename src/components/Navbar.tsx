import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { settings, activePage, setActivePage, cart, cartSubtotal, setIsCartOpen, isAuthenticated } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <button
            onClick={() => setActivePage('home')}
            className="text-left font-serif text-xl sm:text-2xl font-bold tracking-tight text-amber-50 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span>{settings?.name || 'Restaurant Starter'}</span>
          </button>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
            <button
              onClick={() => setActivePage('home')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'home' ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActivePage('menu')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'menu' ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActivePage('about')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'about' ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActivePage('contact')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'contact' ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => setActivePage('track')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'track' ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
              }`}
            >
              Track Order
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActivePage('admin')}
                className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-amber-400 font-semibold ${
                  activePage === 'admin' ? 'border-b-2 border-amber-400 pb-0.5' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action (Cart Drawer Trigger) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="View basket"
              className="relative flex items-center gap-2.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-sm rounded-lg transition-all duration-200 shadow-md active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-stone-950" />
              <span className="font-semibold">Basket</span>
              {totalCartCount > 0 && (
                <>
                  <span className="bg-stone-950 text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                    {totalCartCount}
                  </span>
                  <span className="hidden sm:inline-block text-xs font-semibold tabular-nums text-stone-900 border-l border-amber-700/50 pl-2">
                    {settings?.currency || '£'}{cartSubtotal.toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between border-t border-stone-800/80 py-2.5 overflow-x-auto text-xs font-medium text-stone-300 gap-4 no-scrollbar">
          <button
            onClick={() => setActivePage('home')}
            className={`whitespace-nowrap px-2 py-1 ${activePage === 'home' ? 'text-amber-300 font-bold' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setActivePage('menu')}
            className={`whitespace-nowrap px-2 py-1 ${activePage === 'menu' ? 'text-amber-300 font-bold' : ''}`}
          >
            Menu
          </button>
          <button
            onClick={() => setActivePage('about')}
            className={`whitespace-nowrap px-2 py-1 ${activePage === 'about' ? 'text-amber-300 font-bold' : ''}`}
          >
            About
          </button>
          <button
            onClick={() => setActivePage('contact')}
            className={`whitespace-nowrap px-2 py-1 ${activePage === 'contact' ? 'text-amber-300 font-bold' : ''}`}
          >
            Contact
          </button>
          <button
            onClick={() => setActivePage('track')}
            className={`whitespace-nowrap px-2 py-1 ${activePage === 'track' ? 'text-amber-300 font-bold' : ''}`}
          >
            Track Order
          </button>
          <button
            onClick={() => setActivePage('admin')}
            className={`whitespace-nowrap px-2 py-1 text-stone-400 flex items-center gap-1 ${activePage === 'admin' ? 'text-amber-300 font-bold' : ''}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

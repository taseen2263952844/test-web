import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { MapPin, Phone, Clock, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, setActivePage } = useApp();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800/70">
          
          {/* Brand & Ethos */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="font-serif text-xl font-bold text-stone-100 tracking-tight">
              {settings?.name || 'The Heritage English Kitchen'}
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              {settings?.tagline || 'Artisan British fare & seasonal comforts rooted in English culinary heritage.'}
            </p>
            <div className="flex items-center gap-3 text-xs text-amber-400 font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Cash on Delivery</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Pay at Pickup</span>
              </span>
            </div>
          </div>

          {/* Opening Times */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Service Hours</span>
            </h4>
            <p className="text-sm text-stone-300 whitespace-pre-line leading-relaxed">
              {settings?.opening_hours || 'Mon-Fri: 12:00 - 22:00\nSat-Sun: 11:30 - 22:30'}
            </p>
            <p className="text-xs text-stone-400">
              Fresh orders accepted until 30 minutes before closing.
            </p>
          </div>

          {/* Location & Orders */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Find & Contact Us</span>
            </h4>
            <p className="text-sm text-stone-300 leading-relaxed">
              {settings?.address || '14 High Street, Winchester, Hampshire'}
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-300 font-medium">
              <Phone className="w-4 h-4" />
              <a href={`tel:${settings?.phone}`} className="hover:underline">
                {settings?.phone || '+44 1962 841234'}
              </a>
            </div>
          </div>

          {/* Quick Navigation & Admin Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>
                <button onClick={() => setActivePage('menu')} className="hover:text-amber-300 transition-colors">
                  View Full Menu
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-amber-300 transition-colors">
                  About Our Kitchen & Heritage
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('contact')} className="hover:text-amber-300 transition-colors">
                  Contact & Table Enquiries
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('track')} className="hover:text-amber-300 transition-colors">
                  Track Existing Order
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => setActivePage('admin')}
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors font-medium border border-stone-800 rounded px-2.5 py-1.5 w-fit"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Owner Administration</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} {settings?.name || 'Restaurant Starter'}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Powered by Cloudflare Workers &amp; D1</span>
            <span>·</span>
            <span>English Culinary Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

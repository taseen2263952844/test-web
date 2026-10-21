import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ShieldCheck, HeartHandshake, Leaf, Award, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { settings, setActivePage } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      
      {/* Editorial Header */}
      <div className="space-y-4 max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
          Our Heritage &amp; Craft
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
          An English Kitchen Grounded in Land &amp; Coast.
        </h1>
        <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
          {settings?.name || 'The Heritage English Kitchen'} was founded with a straightforward conviction: that traditional British food, when prepared with immaculate produce and honest technique, stands among the world's great comfort cuisines.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Leaf className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Responsible British Sourcing
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            We buy our seafood from Cornish day-boats with traceable catch certificates, our free-range pork from Wiltshire heritage herds, and our root vegetables from Hampshire family growers. We never cut corners on animal welfare or environmental provenance.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Time-Honored Techniques
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Our bone marrow gravy simmers for 48 hours. Our Yorkshire puddings rise tall in smoking beef dripping. Our triple-cooked chips are steeped and twice-fried in small batches for unmistakable crispness.
          </p>
        </div>
      </div>

      {/* Sourcing Table / Transparency */}
      <div className="bg-stone-900 text-stone-100 p-8 sm:p-10 rounded-3xl space-y-6">
        <h3 className="font-serif text-2xl font-bold text-amber-50">
          Our Primary Producers &amp; Suppliers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="border-t border-stone-800 pt-3">
            <span className="text-xs uppercase font-bold text-amber-400 block mb-1">Beef &amp; Game</span>
            <span className="font-semibold text-white block">Pasture-Fed Native Breeds</span>
            <span className="text-xs text-stone-400">Dry-aged 28 days in dry chambers for tenderness.</span>
          </div>
          <div className="border-t border-stone-800 pt-3">
            <span className="text-xs uppercase font-bold text-amber-400 block mb-1">Fisheries</span>
            <span className="font-semibold text-white block">Cornish &amp; North Sea Fleet</span>
            <span className="text-xs text-stone-400">Line-caught prime cod, haddock &amp; mackerel landed daily.</span>
          </div>
          <div className="border-t border-stone-800 pt-3">
            <span className="text-xs uppercase font-bold text-amber-400 block mb-1">Dairy &amp; Ales</span>
            <span className="font-semibold text-white block">Cornish Clotted Cream &amp; Cask Ales</span>
            <span className="text-xs text-stone-400">Rich butter and golden malts sourced from independent regional brewers.</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center py-6 space-y-4">
        <h3 className="font-serif text-2xl font-bold text-stone-900">
          Experience the Table Tonight
        </h3>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Order for doorstep delivery with cash on arrival, or collect your dinner directly from the kitchen counter.
        </p>
        <button
          onClick={() => setActivePage('menu')}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Order From Menu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

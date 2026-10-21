/**
 * Restaurant Starter - Main Application
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { MenuPage } from './pages/MenuPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activePage, loading, error, refreshData, toasts } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      <Navbar />

      {/* Floating Notifications / Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-stone-900/95 text-amber-200 border-amber-500/30'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/40'
                : 'bg-stone-900/95 text-stone-200 border-stone-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Error Banner if Server Unreachable */}
      {error && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs text-center flex items-center justify-center gap-3">
          <span>{error}</span>
          <button
            onClick={() => refreshData()}
            className="font-bold underline hover:no-underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Pages */}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-stone-500">
            <RefreshCw className="w-7 h-7 text-amber-600 animate-spin" />
            <span className="text-xs font-medium tracking-wide">Loading kitchen menu &amp; details...</span>
          </div>
        ) : (
          <>
            {activePage === 'home' && <HomePage />}
            {activePage === 'menu' && <MenuPage />}
            {activePage === 'about' && <AboutPage />}
            {activePage === 'contact' && <ContactPage />}
            {activePage === 'track' && <OrderTrackingPage />}
            {activePage === 'admin' && <AdminPage />}
          </>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

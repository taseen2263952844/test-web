import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RestaurantSettings, MenuCategory, MenuItem, CartItem, OrderType } from '../types.ts';

interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  settings: RestaurantSettings | null;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Navigation
  activePage: 'home' | 'menu' | 'about' | 'contact' | 'track' | 'admin';
  setActivePage: (page: 'home' | 'menu' | 'about' | 'contact' | 'track' | 'admin') => void;
  trackingOrderNumber: string;
  setTrackingOrderNumber: (num: string) => void;

  // Toast
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Owner Auth
  isAuthenticated: boolean;
  ownerUser: { id: string; username: string } | null;
  csrfToken: string | null;
  checkAuth: () => Promise<void>;
  fetchCsrfToken: () => Promise<string>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rs_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active page state with URL hash syncing
  const [activePage, setActivePageState] = useState<'home' | 'menu' | 'about' | 'contact' | 'track' | 'admin'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['home', 'menu', 'about', 'contact', 'track', 'admin'].includes(hash)) {
      return hash as any;
    }
    return 'home';
  });

  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('track') || '';
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [ownerUser, setOwnerUser] = useState<{ id: string; username: string } | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const setActivePage = (page: 'home' | 'menu' | 'about' | 'contact' | 'track' | 'admin') => {
    setActivePageState(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync hash changes (e.g. back button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'menu', 'about', 'contact', 'track', 'admin'].includes(hash)) {
        setActivePageState(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rs_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch('/api/auth/csrf');
      const data = await res.json();
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
      return '';
    } catch {
      return '';
    }
  }, []);

  // Check Owner Auth
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setOwnerUser(data.user);
        await fetchCsrfToken();
      } else {
        setIsAuthenticated(false);
        setOwnerUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setOwnerUser(null);
    }
  }, [fetchCsrfToken]);

  // Fetch initial public data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, categoriesRes, menuRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
        fetch('/api/menu')
      ]);

      if (!settingsRes.ok || !categoriesRes.ok || !menuRes.ok) {
        throw new Error('Failed to load restaurant data from server');
      }

      const settingsData = await settingsRes.json();
      const categoriesData = await categoriesRes.json();
      const menuData = await menuRes.json();

      setSettings(settingsData);
      setCategories(categoriesData);
      setMenuItems(menuData);

      // Adjust default order type if delivery or pickup is disabled
      if (settingsData) {
        if (!settingsData.delivery_enabled && settingsData.pickup_enabled) {
          setOrderType('pickup');
        } else if (settingsData.delivery_enabled && !settingsData.pickup_enabled) {
          setOrderType('delivery');
        }
      }
    } catch (err: any) {
      console.error('Data refresh error:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    checkAuth();
    fetchCsrfToken();
  }, [refreshData, checkAuth, fetchCsrfToken]);

  // Cart operations
  const addToCart = (item: MenuItem, quantity = 1, notes = '') => {
    if (!item.is_available) {
      showToast(`${item.name} is currently sold out`, 'error');
      return;
    }
    setCart(prev => {
      const existingIndex = prev.findIndex(ci => ci.menuItem.id === item.id && (ci.notes || '') === (notes || ''));
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
    showToast(`Added ${item.name} to your basket`, 'success');
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(ci => ci.menuItem.id === itemId ? { ...ci, quantity } : ci));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.menuItem.id !== itemId));
    showToast('Item removed from basket', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setOwnerUser(null);
    showToast('Logged out of owner dashboard', 'info');
    setActivePage('home');
  };

  // Cart Totals calculation
  const cartSubtotal = Number(
    cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0).toFixed(2)
  );

  let cartDeliveryFee = 0;
  if (orderType === 'delivery' && settings) {
    if (settings.free_delivery_threshold > 0 && cartSubtotal >= settings.free_delivery_threshold) {
      cartDeliveryFee = 0;
    } else {
      cartDeliveryFee = settings.delivery_charge;
    }
  }

  const cartTotal = Number((cartSubtotal + cartDeliveryFee).toFixed(2));

  return (
    <AppContext.Provider
      value={{
        settings,
        categories,
        menuItems,
        loading,
        error,
        refreshData,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        orderType,
        setOrderType,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        activePage,
        setActivePage,
        trackingOrderNumber,
        setTrackingOrderNumber,
        toasts,
        showToast,
        isAuthenticated,
        ownerUser,
        csrfToken,
        checkAuth,
        fetchCsrfToken,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

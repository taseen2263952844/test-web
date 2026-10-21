import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ShieldCheck, LogOut, RefreshCw, Plus, Edit3, Trash2, CheckCircle2,
  AlertCircle, Eye, EyeOff, Upload, Settings, Menu as MenuIcon, ShoppingBag,
  Truck, ArrowRight, ExternalLink, HelpCircle, Save, X
} from 'lucide-react';
import type { Order, MenuItem, MenuCategory, RestaurantSettings, OrderStatus } from '../types.ts';

export const AdminPage: React.FC = () => {
  const {
    isAuthenticated,
    ownerUser,
    logout,
    checkAuth,
    csrfToken,
    fetchCsrfToken,
    showToast,
    settings,
    categories,
    menuItems,
    refreshData,
    setActivePage
  } = useApp();

  // Bootstrap & Auth State
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);
  const [hasSecretConfigured, setHasSecretConfigured] = useState<boolean>(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  // Bootstrap Form
  const [bsUsername, setBsUsername] = useState('');
  const [bsPassword, setBsPassword] = useState('');
  const [bsConfirm, setBsConfirm] = useState('');
  const [bsSecret, setBsSecret] = useState('');
  const [bsSubmitting, setBsSubmitting] = useState(false);
  const [bsError, setBsError] = useState<string | null>(null);

  // Login Form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Active Tab
  const [adminTab, setAdminTab] = useState<'orders' | 'menu' | 'categories' | 'settings' | 'deployment'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Menu Item Modal State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormCategoryId, setItemFormCategoryId] = useState('');
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormDescription, setItemFormDescription] = useState('');
  const [itemFormPrice, setItemFormPrice] = useState('');
  const [itemFormImageUrl, setItemFormImageUrl] = useState('');
  const [itemFormDietary, setItemFormDietary] = useState('');
  const [itemFormSortOrder, setItemFormSortOrder] = useState('0');
  const [itemFormAvailable, setItemFormAvailable] = useState(true);
  const [itemFormActive, setItemFormActive] = useState(true);
  const [itemSaving, setItemSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Modal State
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catFormName, setCatFormName] = useState('');
  const [catFormOrder, setCatFormOrder] = useState('0');
  const [catFormActive, setCatFormActive] = useState(true);
  const [catSaving, setCatSaving] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<RestaurantSettings>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  const currency = settings?.currency || '£';

  // 1. Check Bootstrap status
  const checkBootstrap = useCallback(async () => {
    setCheckingBootstrap(true);
    try {
      const res = await fetch('/api/auth/bootstrap-status');
      const data = await res.json();
      setNeedsBootstrap(data.needsBootstrap);
      setHasSecretConfigured(data.hasSecretConfigured);
    } catch {
      setNeedsBootstrap(false);
    } finally {
      setCheckingBootstrap(false);
    }
  }, []);

  useEffect(() => {
    checkBootstrap();
  }, [checkBootstrap]);

  // Load Settings into form
  useEffect(() => {
    if (settings) {
      setSettingsForm({ ...settings });
    }
  }, [settings]);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // 3. Handle Bootstrap Submit
  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBsError(null);

    if (bsPassword !== bsConfirm) {
      setBsError('Passwords do not match');
      return;
    }
    if (bsPassword.length < 8) {
      setBsError('Password must be at least 8 characters long');
      return;
    }

    setBsSubmitting(true);
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: bsUsername,
          password: bsPassword,
          bootstrap_secret: bsSecret || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      showToast('Owner account initialized successfully! Welcome to your dashboard.', 'success');
      await checkAuth();
      await checkBootstrap();
    } catch (err: any) {
      setBsError(err.message || 'Registration failed');
    } finally {
      setBsSubmitting(false);
    }
  };

  // 4. Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      showToast('Welcome back, owner!', 'success');
      await checkAuth();
      await fetchCsrfToken();
      fetchOrders();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // 5. Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order status');
      }

      showToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 6. Handle Image File Upload to /api/upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'menuItem' | 'settingsHero' | 'settingsLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (targetField === 'menuItem') {
        setItemFormImageUrl(data.url);
      } else if (targetField === 'settingsHero') {
        setSettingsForm(prev => ({ ...prev, hero_url: data.url }));
      } else if (targetField === 'settingsLogo') {
        setSettingsForm(prev => ({ ...prev, logo_url: data.url }));
      }

      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // 7. Toggle item availability or active state
  const handleToggleItem = async (item: MenuItem, field: 'is_available' | 'is_active') => {
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const newValue = item[field] === 1 ? 0 : 1;
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({ [field]: newValue })
      });

      if (!res.ok) throw new Error('Update failed');
      showToast(`${item.name}: ${field === 'is_available' ? (newValue ? 'Marked In Stock' : 'Marked Sold Out') : (newValue ? 'Shown' : 'Hidden')}`, 'info');
      refreshData();
    } catch (err: any) {
      showToast('Failed to update item state', 'error');
    }
  };

  // 8. Delete Menu Item
  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${item.name}"?`)) return;
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': token }
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Dish removed from menu', 'info');
      refreshData();
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  // 9. Open Edit / Add Item Modal
  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemFormCategoryId(item.category_id);
      setItemFormName(item.name);
      setItemFormDescription(item.description);
      setItemFormPrice(String(item.price));
      setItemFormImageUrl(item.image_url || '');
      setItemFormDietary(item.dietary_flags || '');
      setItemFormSortOrder(String(item.sort_order || 0));
      setItemFormAvailable(item.is_available === 1);
      setItemFormActive(item.is_active === 1);
    } else {
      setEditingItem(null);
      setItemFormCategoryId(categories[0]?.id || '');
      setItemFormName('');
      setItemFormDescription('');
      setItemFormPrice('');
      setItemFormImageUrl('');
      setItemFormDietary('');
      setItemFormSortOrder('0');
      setItemFormAvailable(true);
      setItemFormActive(true);
    }
    setIsItemModalOpen(true);
  };

  // 10. Save Menu Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemSaving(true);
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const payload = {
        category_id: itemFormCategoryId,
        name: itemFormName,
        description: itemFormDescription,
        price: parseFloat(itemFormPrice),
        image_url: itemFormImageUrl || null,
        dietary_flags: itemFormDietary,
        sort_order: parseInt(itemFormSortOrder) || 0,
        is_available: itemFormAvailable ? 1 : 0,
        is_active: itemFormActive ? 1 : 0
      };

      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save item');
      }

      showToast(editingItem ? 'Item updated successfully!' : 'New dish created!', 'success');
      setIsItemModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save item', 'error');
    } finally {
      setItemSaving(false);
    }
  };

  // 11. Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const payload = {
        name: catFormName,
        display_order: parseInt(catFormOrder) || 0,
        is_active: catFormActive ? 1 : 0
      };

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save category');

      showToast('Category saved!', 'success');
      setIsCatModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  // 12. Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const token = csrfToken || (await fetchCsrfToken());
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify(settingsForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      showToast('Restaurant settings updated successfully!', 'success');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'active') {
      return ['received', 'preparing', 'out_for_delivery', 'ready_for_pickup'].includes(o.status);
    }
    return o.status === orderStatusFilter;
  });

  // -------------------------------------------------------------------------
  // RENDER: Loading Initial State
  // -------------------------------------------------------------------------
  if (checkingBootstrap) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: One-Time Owner Bootstrap Flow (if no owner exists)
  // -------------------------------------------------------------------------
  if (needsBootstrap) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-lg space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Initial Owner Bootstrap
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed">
              Create the sole restaurant owner credentials. Once registered, this initialization form becomes permanently locked for maximum security.
            </p>
          </div>

          {bsError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{bsError}</span>
            </div>
          )}

          <form onSubmit={handleBootstrap} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Owner Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. kitchen_owner"
                value={bsUsername}
                onChange={e => setBsUsername(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Master Password <span className="text-rose-500">* (min. 8 characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={bsPassword}
                onChange={e => setBsPassword(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Confirm Master Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={bsConfirm}
                onChange={e => setBsConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>

            {hasSecretConfigured && (
              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Worker Bootstrap Secret Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter BOOTSTRAP_SECRET value from Worker env"
                  value={bsSecret}
                  onChange={e => setBsSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  A secret key was defined in your Cloudflare Worker environment variables.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={bsSubmitting}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {bsSubmitting ? 'Registering & Hashing Password...' : 'Initialize Owner Account'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Login Flow (if owner exists, but user is logged out)
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-lg space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-stone-900 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Owner Administration
            </h1>
            <p className="text-xs text-stone-500">
              Please sign in with your verified owner credentials.
            </p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="Owner username"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>

            <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              Protected by PBKDF2 password hashing &amp; automated rate-limit lockout after 5 consecutive failures.
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {loginSubmitting ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Full Owner Dashboard
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Owner Control Center</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-amber-50">
            {settings?.name || 'Restaurant Starter'} Management
          </h1>
          <p className="text-xs text-stone-400">
            Logged in as <strong className="text-stone-200">{ownerUser?.username}</strong> · Changes take effect immediately without code redeployment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActivePage('home')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 font-medium rounded-lg border border-stone-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Preview Public Site</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-xs text-rose-300 font-medium rounded-lg border border-rose-800/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 no-scrollbar">
        <button
          onClick={() => setAdminTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            adminTab === 'orders'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Live Orders</span>
          {orders.filter(o => ['received', 'preparing'].includes(o.status)).length > 0 && (
            <span className="bg-amber-600 text-stone-950 text-xs font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {orders.filter(o => ['received', 'preparing'].includes(o.status)).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            adminTab === 'menu'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span>Menu Items ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            adminTab === 'categories'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            adminTab === 'settings'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Restaurant Settings</span>
        </button>

        <button
          onClick={() => setAdminTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            adminTab === 'deployment'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Cloudflare Deployment</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: LIVE ORDERS */}
      {/* ------------------------------------------------------------------- */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'active', 'received', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setOrderStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap cursor-pointer ${
                    orderStatusFilter === f
                      ? 'bg-stone-900 text-amber-300'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-stone-200 text-xs font-semibold text-stone-700 rounded-lg hover:bg-stone-50 transition-colors w-fit cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-amber-600' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">No orders in this view</h3>
              <p className="text-xs text-stone-500">Incoming customer orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map(ord => (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-amber-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-stone-900">
                        {ord.order_number}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        ord.order_type === 'delivery' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {ord.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                      <span className="text-xs text-stone-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Current Status:</span>
                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${
                        ord.status === 'received' ? 'bg-amber-100 text-amber-900' :
                        ord.status === 'preparing' ? 'bg-orange-100 text-orange-900' :
                        ord.status === 'out_for_delivery' || ord.status === 'ready_for_pickup' ? 'bg-sky-100 text-sky-900' :
                        ord.status === 'completed' ? 'bg-emerald-100 text-emerald-900' :
                        'bg-stone-200 text-stone-700'
                      }`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Customer and Order Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer */}
                    <div className="space-y-1">
                      <span className="font-bold text-stone-700 block">Customer</span>
                      <div className="text-stone-900 font-semibold">{ord.customer_name}</div>
                      <div className="text-stone-600 font-mono">{ord.customer_phone}</div>
                      {ord.order_type === 'delivery' && (
                        <div className="text-stone-600 mt-1 whitespace-pre-line bg-stone-50 p-2 rounded border border-stone-100">
                          {ord.delivery_address}
                        </div>
                      )}
                      {ord.order_notes && (
                        <div className="text-amber-900 italic mt-1">
                          Notes: "{ord.order_notes}"
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="font-bold text-stone-700 block">Dishes Ordered</span>
                      <div className="divide-y divide-stone-100">
                        {ord.items?.map(it => (
                          <div key={it.id} className="py-1 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-amber-900 mr-2">{it.quantity}×</span>
                              <span className="font-medium text-stone-800">{it.item_name}</span>
                              {it.notes && (
                                <span className="text-stone-500 italic ml-2">({it.notes})</span>
                              )}
                            </div>
                            <span className="font-mono text-stone-700">{currency}{it.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
                        <span>Total ({ord.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Pay at Pickup'})</span>
                        <span className="text-amber-900 tabular-nums">{currency}{ord.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium mr-2">Advance Workflow:</span>
                    
                    {ord.status === 'received' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                        disabled={updatingOrderId === ord.id}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Start Preparing in Kitchen
                      </button>
                    )}

                    {ord.status === 'preparing' && ord.order_type === 'delivery' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'out_for_delivery')}
                        disabled={updatingOrderId === ord.id}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Dispatch / Out for Delivery
                      </button>
                    )}

                    {ord.status === 'preparing' && ord.order_type === 'pickup' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                        disabled={updatingOrderId === ord.id}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Ready for Counter Pickup
                      </button>
                    )}

                    {['out_for_delivery', 'ready_for_pickup', 'preparing'].includes(ord.status) && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                        disabled={updatingOrderId === ord.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Order Completed
                      </button>
                    )}

                    {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                        disabled={updatingOrderId === ord.id}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors ml-auto cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: MENU ITEMS */}
      {/* ------------------------------------------------------------------- */}
      {adminTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Dishes &amp; Culinary Offerings
            </h2>
            <button
              onClick={() => openItemModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
            {menuItems.map(item => {
              const cat = categories.find(c => c.id === item.category_id);
              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <MenuIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-800 font-semibold uppercase">
                          {cat?.name || 'Uncategorized'}
                        </span>
                        {item.dietary_flags && (
                          <>
                            <span className="text-stone-300">·</span>
                            <span className="text-[11px] text-stone-500">{item.dietary_flags}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-serif text-base font-bold text-stone-900">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1 max-w-md">
                        {item.description}
                      </p>
                      <div className="font-mono font-bold text-xs text-stone-900">
                        {currency}{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="flex items-center gap-3">
                    {/* Availability toggle */}
                    <button
                      onClick={() => handleToggleItem(item, 'is_available')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        item.is_available
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>

                    {/* Visibility toggle */}
                    <button
                      onClick={() => handleToggleItem(item, 'is_active')}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        item.is_active
                          ? 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          : 'bg-stone-200 text-stone-400 border-stone-300'
                      }`}
                      title={item.is_active ? 'Visible on menu' : 'Hidden from public'}
                    >
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openItemModal(item)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                      title="Edit dish details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: CATEGORIES */}
      {/* ------------------------------------------------------------------- */}
      {adminTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Menu Sections &amp; Categories
            </h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatFormName('');
                setCatFormOrder(String(categories.length + 1));
                setCatFormActive(true);
                setIsCatModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
            {categories.map(cat => {
              const count = menuItems.filter(i => i.category_id === cat.id).length;
              return (
                <div key={cat.id} className="p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{cat.name}</h3>
                    <div className="text-xs text-stone-500 font-mono">
                      slug: {cat.slug} · Display order: {cat.display_order} · {count} dishes
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCatFormName(cat.name);
                        setCatFormOrder(String(cat.display_order));
                        setCatFormActive(cat.is_active === 1);
                        setIsCatModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: SETTINGS */}
      {/* ------------------------------------------------------------------- */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Restaurant Identity &amp; Service Settings
            </h2>
            <p className="text-xs text-stone-500">
              Configured values update instantly across the customer storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Restaurant Name</label>
              <input
                type="text"
                required
                value={settingsForm.name || ''}
                onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={settingsForm.tagline || ''}
                onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-stone-700 font-medium mb-1">Public Story / Description</label>
              <textarea
                rows={3}
                value={settingsForm.description || ''}
                onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Telephone Contact</label>
              <input
                type="text"
                required
                value={settingsForm.phone || ''}
                onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={settingsForm.email || ''}
                onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-stone-700 font-medium mb-1">Physical Address</label>
              <input
                type="text"
                required
                value={settingsForm.address || ''}
                onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-stone-700 font-medium mb-1">Opening Hours Schedule</label>
              <input
                type="text"
                value={settingsForm.opening_hours || ''}
                onChange={e => setSettingsForm({ ...settingsForm, opening_hours: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
              />
            </div>

            {/* Service Toggles & Pricing */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">Home Delivery Service</span>
                  <span className="text-stone-500 text-[11px]">Allow customers to place delivery orders</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.delivery_enabled === 1}
                  onChange={e => setSettingsForm({ ...settingsForm, delivery_enabled: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-amber-600 rounded"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Delivery Charge ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.delivery_charge ?? 3.50}
                  onChange={e => setSettingsForm({ ...settingsForm, delivery_charge: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Minimum Order Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.min_order_amount ?? 15.00}
                  onChange={e => setSettingsForm({ ...settingsForm, min_order_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Free Delivery Threshold ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.free_delivery_threshold ?? 45.00}
                  onChange={e => setSettingsForm({ ...settingsForm, free_delivery_threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">Pickup / Collection Service</span>
                  <span className="text-stone-500 text-[11px]">Allow customers to collect and pay at counter</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.pickup_enabled === 1}
                  onChange={e => setSettingsForm({ ...settingsForm, pickup_enabled: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-amber-600 rounded"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={settingsForm.currency || '£'}
                  onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>
            </div>

            {/* Images */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-stone-700 font-medium">Hero Image URL or Upload</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settingsForm.hero_url || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, hero_url: e.target.value })}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                  placeholder="/src/assets/images/... or https://..."
                />
                <label className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleImageUpload(e, 'settingsHero')}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{settingsSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 5: CLOUDFLARE DEPLOYMENT & ARCHITECTURE GUIDE */}
      {/* ------------------------------------------------------------------- */}
      {adminTab === 'deployment' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-8 text-stone-800">
          <div className="space-y-2 border-b border-stone-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Production Setup Guide
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Cloudflare Workers, D1 Database &amp; R2 Image Hosting
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Step-by-step instructions to deploy this project completely via GitHub and the Cloudflare browser dashboard — fully executable from an Android phone or any browser.
            </p>
          </div>

          {/* Section 1: D1 Database */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">1</span>
              <span>Create Cloudflare D1 Database in Cloudflare Dashboard</span>
            </h3>
            <ol className="list-decimal list-inside text-xs text-stone-600 space-y-1.5 pl-2 leading-relaxed">
              <li>Open <strong>dash.cloudflare.com</strong> in your browser (mobile or desktop).</li>
              <li>Navigate to <strong>Workers &amp; Pages</strong> &gt; <strong>D1 SQL Database</strong>.</li>
              <li>Click <strong>Create database</strong>, choose <strong>Dashboard</strong>, and name it <code>restaurant-starter-db</code>.</li>
              <li>Copy the generated <strong>Database ID</strong> (UUID format).</li>
              <li>In your GitHub repository, open <code>wrangler.jsonc</code> and paste the UUID into <code>database_id</code>.</li>
            </ol>
          </div>

          {/* Section 2: Run Migrations */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">2</span>
              <span>Run Database Migrations (Phone &amp; Browser Friendly)</span>
            </h3>
            <div className="text-xs text-stone-600 space-y-2 pl-2 leading-relaxed">
              <p>
                <strong>Option A (100% Browser Dashboard, no CLI needed):</strong>
              </p>
              <p className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                Inside your D1 database dashboard on Cloudflare, click the <strong>Console</strong> tab. Copy the SQL from <code>migrations/0001_initial_schema.sql</code> and paste it into the console, then click <strong>Execute</strong>. Repeat for <code>migrations/0002_seed_data.sql</code>!
              </p>
              <p>
                <strong>Option B (Wrangler CLI):</strong>
              </p>
              <pre className="bg-stone-900 text-amber-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
{`npx wrangler d1 migrations apply restaurant-starter-db --remote`}
              </pre>
            </div>
          </div>

          {/* Section 3: GitHub Deployment */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">3</span>
              <span>Connect GitHub to Cloudflare Workers Builds</span>
            </h3>
            <ol className="list-decimal list-inside text-xs text-stone-600 space-y-1.5 pl-2 leading-relaxed">
              <li>Push this repository to your GitHub account.</li>
              <li>In Cloudflare Dashboard, go to <strong>Workers &amp; Pages</strong> &gt; <strong>Create application</strong> &gt; <strong>Pages / Workers</strong>.</li>
              <li>Select <strong>Connect to Git</strong>, authorize GitHub, and select this repository.</li>
              <li>Set <strong>Build Command</strong>: <code>npm run build</code></li>
              <li>Set <strong>Build Output Directory</strong>: <code>dist</code></li>
              <li>Under <strong>Environment Variables</strong>, add <code>BOOTSTRAP_SECRET</code> with your chosen secret passphrase.</li>
              <li>Click <strong>Save and Deploy</strong>!</li>
            </ol>
          </div>

          {/* Section 4: Initial Bootstrap */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">4</span>
              <span>Create Initial Owner Account Securely</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed pl-2">
              Once deployed, visit <code>https://your-worker.workers.dev/#admin</code>. The application detects that no owner account exists yet and displays the one-time Owner Bootstrap form. Enter your desired username, a strong password, and your <code>BOOTSTRAP_SECRET</code>. Once created, the bootstrap endpoint is permanently disabled in the database, preventing any unauthorized registration.
            </p>
          </div>

          {/* Section 5: Optional R2 Bucket */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">5</span>
              <span>Optional: Cloudflare R2 Image Uploads</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed pl-2">
              In Cloudflare Dashboard, go to <strong>R2</strong> &gt; <strong>Create bucket</strong> named <code>restaurant-starter-images</code>. In your Worker settings under <strong>Bindings</strong>, bind the R2 bucket as <code>IMAGES</code>. The backend automatically routes image uploads directly to R2!
            </p>
          </div>

          {/* Section 6: Testing Checklist */}
          <div className="space-y-3 bg-stone-50 p-5 rounded-xl border border-stone-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Manual Testing Checklist
            </h4>
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Customer adds items to basket, selects Delivery, enters address, and receives unique order number.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Customer selects Pickup, verifies address field is not requested, and verifies cash/counter terms.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Customer enters order number into Track Order page and monitors live status.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Owner logs into /admin and advances order status from "Received" to "Preparing" to "Completed".</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Owner marks an item "Sold Out" and confirms customer menu immediately disables ordering for that dish.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: EDIT / ADD MENU ITEM */}
      {/* ------------------------------------------------------------------- */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsItemModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl z-10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingItem ? 'Edit Dish Details' : 'Add New Dish to Menu'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Dish Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={itemFormName}
                  onChange={e => setItemFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Category <span className="text-rose-500">*</span></label>
                  <select
                    value={itemFormCategoryId}
                    onChange={e => setItemFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Price ({currency}) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={itemFormPrice}
                    onChange={e => setItemFormPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={itemFormDescription}
                  onChange={e => setItemFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Dietary Tags (e.g. Vegetarian, Gluten-Free)</label>
                <input
                  type="text"
                  value={itemFormDietary}
                  onChange={e => setItemFormDietary(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Image URL or Photo Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemFormImageUrl}
                    onChange={e => setItemFormImageUrl(e.target.value)}
                    placeholder="/src/assets/images/... or https://..."
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                  />
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'menuItem')}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormAvailable}
                    onChange={e => setItemFormAvailable(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="font-medium text-stone-800">In Stock / Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormActive}
                    onChange={e => setItemFormActive(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="font-medium text-stone-800">Visible on Public Menu</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg shadow-xs"
                >
                  {itemSaving ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: CATEGORY EDIT */}
      {/* ------------------------------------------------------------------- */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsCatModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl z-10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={e => setCatFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Display Order Position</label>
                <input
                  type="number"
                  value={catFormOrder}
                  onChange={e => setCatFormOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg shadow-xs"
                >
                  {catSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

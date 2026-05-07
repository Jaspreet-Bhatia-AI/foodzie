'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, LayoutGrid } from 'lucide-react';
import { api } from '@/lib/api';
import CategoryPanel, { Category } from '@/components/vendor/CategoryPanel';
import FoodItemPanel, { FoodItem } from '@/components/vendor/FoodItemPanel';

interface VendorDataResponse {
  categories: (Category & { items: FoodItem[] })[];
}
interface ItemsResponse {
  items: FoodItem[];
}

export default function InventoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems]           = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [catRes, itemRes] = await Promise.all([
        api.get<VendorDataResponse>('/api/vendor/categories'),
        api.get<ItemsResponse>('/api/vendor/items'),
      ]);
      setCategories(catRes.categories);
      setItems(itemRes.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleRefresh() { fetchData(true); }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6 h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-[280px_1fr] gap-6 h-[calc(100vh-120px)]">
          <div className="bg-gray-200 rounded-2xl animate-pulse" />
          <div className="bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Failed to load inventory</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <button onClick={() => fetchData()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-screen flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-4.5 h-4.5 text-orange-600" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} ·{' '}
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <button id="refresh-inventory-btn" onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2 transition-all bg-white">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Two-column panel layout */}
      <div className="grid grid-cols-[280px_1fr] gap-5 flex-1 min-h-0">
        {/* Left: Categories */}
        <CategoryPanel
          categories={categories}
          onRefresh={handleRefresh}
        />

        {/* Right: Food Items */}
        <FoodItemPanel
          categories={categories}
          items={items}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}

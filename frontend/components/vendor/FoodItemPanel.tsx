'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  Plus, Pencil, Trash2, X, Loader2, UtensilsCrossed,
  Flame, Package, ChevronDown, IndianRupee,
} from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Category } from './CategoryPanel';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FoodItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  realPrice: number;
  imageUrl?: string | null;
  prepTimeMins: number;
  isCooked: boolean;
  stock?: number | null;
  discountPercent?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
  categoryId: string;
  category: { id: string; name: string };
}

// ─── Blank form state ────────────────────────────────────────────────────────
function blankForm() {
  return {
    name: '', description: '', price: '', realPrice: '', imageUrl: '',
    prepTimeMins: '15', isCooked: true, inStock: true, stock: '',
    categoryId: '', discountPercent: '', discountStart: '', discountEnd: '',
  };
}

type FormState = ReturnType<typeof blankForm>;

interface Props {
  categories: Category[];
  items: FoodItem[];
  onRefresh: () => void;
}

// ─── Toggle Switch sub-component ────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${
        checked ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
      <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-green-500' : 'bg-red-400'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-green-700' : 'text-red-600'}`}>{label}</span>
    </button>
  );
}

export default function FoodItemPanel({ categories, items, onRefresh }: Props) {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [filterCatId, setFilterCatId]   = useState<string>('all');
  const [showModal, setShowModal]        = useState(false);
  const [editingItem, setEditingItem]    = useState<FoodItem | null>(null);
  const [form, setForm]                  = useState<FormState>(blankForm());
  const [isSubmitting, setIsSubmitting]  = useState(false);
  const [deletingId, setDeletingId]      = useState<string | null>(null);
  const [error, setError]                = useState<string | null>(null);
  const [showDiscount, setShowDiscount]  = useState(false);
  const [imageFile, setImageFile]        = useState<File | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Seed form when editing an existing item
  useEffect(() => {
    if (editingItem) {
      setForm({
        name:            editingItem.name,
        description:     editingItem.description ?? '',
        price:           String(editingItem.price),
        realPrice:       String(editingItem.realPrice ?? (editingItem.price * 0.8)),
        imageUrl:        editingItem.imageUrl ?? '',
        prepTimeMins:    String(editingItem.prepTimeMins),
        isCooked:        editingItem.isCooked,
        // For cooked items: null → available (true), 0 → unavailable (false)
        // For packaged items: inStock isn't really used, so default to stock > 0
        inStock:         editingItem.isCooked
                           ? editingItem.stock !== 0   // null → true, 0 → false
                           : (editingItem.stock ?? 0) > 0,
        stock:           editingItem.stock != null ? String(editingItem.stock) : '',
        categoryId:      editingItem.categoryId,
        discountPercent: editingItem.discountPercent != null ? String(editingItem.discountPercent) : '',
        discountStart:   editingItem.discountStart?.slice(0, 10) ?? '',
        discountEnd:     editingItem.discountEnd?.slice(0, 10) ?? '',
      });
      setShowDiscount(!!editingItem.discountPercent);
      setNewCategoryName('');
    }
  }, [editingItem]);

  function openCreate() {
    setEditingItem(null);
    setForm({ ...blankForm(), categoryId: filterCatId !== 'all' ? filterCatId : '' });
    setShowDiscount(false); setError(null); setImageFile(null); setNewCategoryName(''); setShowModal(true);
  }
  function openEdit(item: FoodItem) { setEditingItem(item); setError(null); setImageFile(null); setNewCategoryName(''); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingItem(null); setForm(blankForm()); setImageFile(null); setNewCategoryName(''); setError(null); }
  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Build the API payload from form state
  function buildPayload(uploadedImageUrl?: string, targetCategoryId?: string) {
    const stockValue = form.isCooked
      ? (form.inStock ? null : 0)              // cooked → null=available, 0=unavailable
      : (form.stock !== '' ? Number(form.stock) : null);  // packaged → numeric count

    return {
      name:            form.name.trim(),
      description:     form.description.trim() || null,
      price:           Number(form.price),
      realPrice:       Number(form.realPrice || 0),
      imageUrl:        uploadedImageUrl || (form.imageUrl.trim() || null),
      prepTimeMins:    form.isCooked ? Number(form.prepTimeMins) : 0,
      isCooked:        form.isCooked,
      stock:           stockValue,
      categoryId:      targetCategoryId || form.categoryId,
      discountPercent: showDiscount && form.discountPercent ? Number(form.discountPercent) : null,
      discountStart:   showDiscount && form.discountStart ? form.discountStart : null,
      discountEnd:     showDiscount && form.discountEnd ? form.discountEnd : null,
    };
  }

  async function handleSubmit() {
    if (!form.name.trim())    { setError('Name is required');     return; }
    if (!form.price)          { setError('Price is required');    return; }
    if (!form.realPrice)      { setError('Cost price is required'); return; }
    if (!form.categoryId)     { setError('Select a category');    return; }
    if (form.categoryId === 'new' && !newCategoryName.trim()) { setError('New category name is required'); return; }
    setIsSubmitting(true); setError(null);
    try {
      let finalCategoryId = form.categoryId;
      if (form.categoryId === 'new') {
        const catRes = await api.post<{ category: Category }>('/api/vendor/categories', { name: newCategoryName.trim() });
        finalCategoryId = catRes.category.id;
      }

      let finalImageUrl = form.imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('foodzie-images').upload(fileName, imageFile);
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('foodzie-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
      
      const payload = buildPayload(finalImageUrl, finalCategoryId);

      if (editingItem) {
        await api.patch(`/api/vendor/items/${editingItem.id}`, payload);
      } else {
        await api.post('/api/vendor/items', payload);
      }
      closeModal(); onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setIsSubmitting(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try { await api.delete(`/api/vendor/items/${id}`); onRefresh(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeletingId(null); }
  }

  // Filtered display
  const displayed = filterCatId === 'all' ? items : items.filter((i) => i.categoryId === filterCatId);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Food Items</h2>
            <span className="bg-orange-105 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 text-xs font-medium rounded-full px-2 py-0.5 border border-orange-500/10">{items.length}</span>
          </div>
          <button id="add-item-btn" onClick={openCreate}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-3 py-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-850">
          <select value={filterCatId} onChange={(e) => setFilterCatId(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-605 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 bg-white dark:bg-gray-900">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayed.length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-400 dark:text-gray-500">
              <UtensilsCrossed className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No items here</p>
              <p className="text-xs mt-1">Click &quot;Add Item&quot; to get started</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            {displayed.map((item) => {
              // Packaged item:  out of stock when stock is 0 or unset
              const outOfStock = item.isCooked
                ? item.stock === 0
                : (item.stock ?? 0) <= 0;
              return (
                <div key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800/80 hover:border-orange-200 dark:hover:border-orange-500/20 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-all group">
                  {/* Image or placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-orange-100/50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <UtensilsCrossed className="w-5 h-5 text-orange-300 dark:text-orange-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-850 dark:text-gray-100 truncate">{item.name}</p>
                      <span className="flex items-center gap-1 text-[10px] bg-orange-100/50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-full px-2 py-0.5 shrink-0 border border-orange-500/10">
                        {item.isCooked ? <Flame className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                        {item.category.name}
                      </span>
                      {outOfStock && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-full px-2 py-0.5 border border-red-500/10">Out of Stock</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-900/20">
                        Sell: {formatCurrency(item.price)}
                      </span>
                      <span className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        Cost: {formatCurrency(item.realPrice ?? 0)}
                      </span>
                      {item.discountPercent && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">-{item.discountPercent}%</span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.prepTimeMins} min</span>
                      {!item.isCooked && item.stock != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{item.stock} left</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button id={`edit-item-${item.id}`} onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
                      aria-label={`Edit ${item.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button id={`delete-item-${item.id}`} onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                      aria-label={`Delete ${item.name}`}>
                      {deletingId === item.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">{editingItem ? 'Edit Food Item' : 'New Food Item'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50/10 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-450 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 mb-1.5">Item Name *</label>
                <input id="item-name-input" type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Veg Samosa" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Brief description…" rows={2}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
              </div>

              {/* Price fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Selling Price ({getCurrencySymbol()}) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-455 font-bold flex items-center justify-center">{getCurrencySymbol()}</span>
                    <input id="item-price-input" type="number" min="0" step="0.5" value={form.price}
                      onChange={(e) => set('price', e.target.value)} placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Cost Price ({getCurrencySymbol()}) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-455 font-bold flex items-center justify-center">{getCurrencySymbol()}</span>
                    <input id="item-realprice-input" type="number" min="0" step="0.5" value={form.realPrice}
                      onChange={(e) => set('realPrice', e.target.value)} placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                  </div>
                </div>
              </div>

              {/* Prep time (if cooked) */}
              {form.isCooked && (
                <div>
                  <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Prep Time (min)</label>
                  <input type="number" min="1" value={form.prepTimeMins}
                    onChange={(e) => set('prepTimeMins', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Category *</label>
                <select id="item-category-select" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white transition-all">
                  <option value="">Select a category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="new">+ Create new category...</option>
                </select>

                {form.categoryId === 'new' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 mb-1.5 font-medium text-orange-600">New Category Name *</label>
                    <input id="item-new-category-input" type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Desserts, Beverages" className="w-full bg-gray-50 dark:bg-gray-950 border border-orange-200 dark:border-orange-900/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                  </div>
                )}
              </div>

              {/* ── isCooked toggle ─────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 mb-2">Item Type</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button type="button" id="type-cooked-btn" onClick={() => set('isCooked', true)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.isCooked
                        ? 'bg-orange-50 dark:bg-orange-955/20 border-orange-400 dark:border-orange-500/50 text-orange-700 dark:text-orange-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}>
                    <Flame className={`w-4 h-4 ${form.isCooked ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`} />
                    Cooked to Order
                  </button>
                  <button type="button" id="type-packaged-btn" onClick={() => set('isCooked', false)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      !form.isCooked
                        ? 'bg-blue-50 dark:bg-blue-955/20 border-blue-400 dark:border-blue-500/50 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}>
                    <Package className={`w-4 h-4 ${!form.isCooked ? 'text-blue-500' : 'text-gray-300'}`} />
                    Packaged / Stock
                  </button>
                </div>

                {/* ── Dynamic stock control ───────────────────────────── */}
                <div className="relative overflow-hidden transition-all duration-300 ease-in-out" style={{ opacity: 1, height: 'auto' }}>
                  {form.isCooked ? (
                    // Cooked items → simple available/unavailable toggle
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Availability</label>
                      <ToggleSwitch
                        checked={form.inStock}
                        onChange={(v) => set('inStock', v)}
                        label={form.inStock ? '✓ In Stock — accepting orders' : '✗ Out of Stock — hidden from menu'}
                      />
                    </div>
                  ) : (
                    // Packaged items → numeric stock count
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">
                        Units in Stock
                      </label>
                      <input id="item-stock-input" type="number" min="0" value={form.stock}
                        onChange={(e) => set('stock', e.target.value)} placeholder="e.g. 50"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                      <p className="text-xs text-gray-450 dark:text-gray-500 mt-1">Set to 0 to mark as out of stock</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Item Image</label>
                <div className="flex items-center gap-3">
                  {(imageFile || form.imageUrl) && (
                    <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shrink-0">
                      {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <img src={form.imageUrl!} alt="Existing" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 dark:file:bg-orange-950/20 file:text-orange-700 dark:file:text-orange-400 hover:file:bg-orange-100 dark:hover:file:bg-orange-900/10 transition-all cursor-pointer" />
                </div>
              </div>

              {/* Discount accordion */}
              <div>
                <button type="button" onClick={() => setShowDiscount((p) => !p)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDiscount ? 'rotate-180' : ''}`} />
                  {showDiscount ? 'Remove Discount' : 'Add Discount (optional)'}
                </button>

                {showDiscount && (
                  <div className="mt-3 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Discount %</label>
                      <input type="number" min="0" max="100" value={form.discountPercent}
                        onChange={(e) => set('discountPercent', e.target.value)} placeholder="e.g. 10"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">Start Date</label>
                      <input type="date" value={form.discountStart}
                        onChange={(e) => set('discountStart', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-655 dark:text-gray-400 mb-1.5">End Date</label>
                      <input type="date" value={form.discountEnd}
                        onChange={(e) => set('discountEnd', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white transition-all" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 rounded-b-2xl">
              <button onClick={closeModal}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-2.5 transition-colors bg-white dark:bg-gray-800">
                Cancel
              </button>
              <button id="item-save-btn" onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl px-5 py-2.5 transition-colors">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

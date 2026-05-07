'use client';

import { useState, useEffect } from 'react';
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
    name: '', description: '', price: '', imageUrl: '',
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
  const [filterCatId, setFilterCatId]   = useState<string>('all');
  const [showModal, setShowModal]        = useState(false);
  const [editingItem, setEditingItem]    = useState<FoodItem | null>(null);
  const [form, setForm]                  = useState<FormState>(blankForm());
  const [isSubmitting, setIsSubmitting]  = useState(false);
  const [deletingId, setDeletingId]      = useState<string | null>(null);
  const [error, setError]                = useState<string | null>(null);
  const [showDiscount, setShowDiscount]  = useState(false);
  const [imageFile, setImageFile]        = useState<File | null>(null);

  // Seed form when editing an existing item
  useEffect(() => {
    if (editingItem) {
      setForm({
        name:            editingItem.name,
        description:     editingItem.description ?? '',
        price:           String(editingItem.price),
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
    }
  }, [editingItem]);

  function openCreate() {
    setEditingItem(null);
    setForm({ ...blankForm(), categoryId: filterCatId !== 'all' ? filterCatId : '' });
    setShowDiscount(false); setError(null); setImageFile(null); setShowModal(true);
  }
  function openEdit(item: FoodItem) { setEditingItem(item); setError(null); setImageFile(null); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingItem(null); setForm(blankForm()); setImageFile(null); setError(null); }
  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Build the API payload from form state
  function buildPayload(uploadedImageUrl?: string) {
    const stockValue = form.isCooked
      ? (form.inStock ? null : 0)              // cooked → null=available, 0=unavailable
      : (form.stock !== '' ? Number(form.stock) : null);  // packaged → numeric count

    return {
      name:            form.name.trim(),
      description:     form.description.trim() || null,
      price:           Number(form.price),
      imageUrl:        uploadedImageUrl || (form.imageUrl.trim() || null),
      prepTimeMins:    form.isCooked ? Number(form.prepTimeMins) : 0,
      isCooked:        form.isCooked,
      stock:           stockValue,
      categoryId:      form.categoryId,
      discountPercent: showDiscount && form.discountPercent ? Number(form.discountPercent) : null,
      discountStart:   showDiscount && form.discountStart ? form.discountStart : null,
      discountEnd:     showDiscount && form.discountEnd ? form.discountEnd : null,
    };
  }

  async function handleSubmit() {
    if (!form.name.trim())    { setError('Name is required');     return; }
    if (!form.price)          { setError('Price is required');    return; }
    if (!form.categoryId)     { setError('Select a category');    return; }
    setIsSubmitting(true); setError(null);
    try {
      let finalImageUrl = form.imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('foodzie-images').upload(fileName, imageFile);
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('foodzie-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
      
      const payload = buildPayload(finalImageUrl);

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Food Items</h2>
            <span className="bg-orange-100 text-orange-600 text-xs font-medium rounded-full px-2 py-0.5">{items.length}</span>
          </div>
          <button id="add-item-btn" onClick={openCreate}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-3 py-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-gray-100">
          <select value={filterCatId} onChange={(e) => setFilterCatId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400/40 bg-white">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayed.length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <UtensilsCrossed className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No items here</p>
              <p className="text-xs mt-1">Click &quot;Add Item&quot; to get started</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            {displayed.map((item) => {
              // Cooked item:    out of stock when stock === 0 (null means available)
              // Packaged item:  out of stock when stock is 0 or unset
              const outOfStock = item.isCooked
                ? item.stock === 0
                : (item.stock ?? 0) <= 0;
              return (
                <div key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
                  {/* Image or placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <UtensilsCrossed className="w-5 h-5 text-orange-300" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 shrink-0">
                        {item.isCooked ? <Flame className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                        {item.category.name}
                      </span>
                      {outOfStock && (
                        <span className="text-[10px] bg-red-100 text-red-500 rounded-full px-2 py-0.5">Out of Stock</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center text-sm font-bold text-gray-900">
                        <IndianRupee className="w-3 h-3" />{item.price.toFixed(2)}
                      </span>
                      {item.discountPercent && (
                        <span className="text-xs text-green-600 font-medium">-{item.discountPercent}%</span>
                      )}
                      <span className="text-xs text-gray-400">{item.prepTimeMins} min</span>
                      {!item.isCooked && item.stock != null && (
                        <span className="text-xs text-gray-400">{item.stock} left</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button id={`edit-item-${item.id}`} onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-100 transition-colors"
                      aria-label={`Edit ${item.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button id={`delete-item-${item.id}`} onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
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

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-semibold text-gray-900">{editingItem ? 'Edit Food Item' : 'New Food Item'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Item Name *</label>
                <input id="item-name-input" type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Veg Samosa" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Brief description…" rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-gray-900 placeholder-gray-400 transition-all" />
              </div>

              {/* Price + Prep time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input id="item-price-input" type="number" min="0" step="0.5" value={form.price}
                      onChange={(e) => set('price', e.target.value)} placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" />
                  </div>
                </div>
                {form.isCooked && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prep Time (min)</label>
                    <input type="number" min="1" value={form.prepTimeMins}
                      onChange={(e) => set('prepTimeMins', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" />
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                <select id="item-category-select" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 transition-all">
                  <option value="">Select a category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* ── isCooked toggle ─────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Item Type</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button type="button" id="type-cooked-btn" onClick={() => set('isCooked', true)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.isCooked
                        ? 'bg-orange-50 border-orange-400 text-orange-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}>
                    <Flame className={`w-4 h-4 ${form.isCooked ? 'text-orange-500' : 'text-gray-300'}`} />
                    Cooked to Order
                  </button>
                  <button type="button" id="type-packaged-btn" onClick={() => set('isCooked', false)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      !form.isCooked
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
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
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Availability</label>
                      <ToggleSwitch
                        checked={form.inStock}
                        onChange={(v) => set('inStock', v)}
                        label={form.inStock ? '✓ In Stock — accepting orders' : '✗ Out of Stock — hidden from menu'}
                      />
                    </div>
                  ) : (
                    // Packaged items → numeric stock count
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Units in Stock
                      </label>
                      <input id="item-stock-input" type="number" min="0" value={form.stock}
                        onChange={(e) => set('stock', e.target.value)} placeholder="e.g. 50"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Set to 0 to mark as out of stock</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Item Image</label>
                <div className="flex items-center gap-3">
                  {(imageFile || form.imageUrl) && (
                    <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                      {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <img src={form.imageUrl!} alt="Existing" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer" />
                </div>
              </div>

              {/* Discount accordion */}
              <div>
                <button type="button" onClick={() => setShowDiscount((p) => !p)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDiscount ? 'rotate-180' : ''}`} />
                  {showDiscount ? 'Remove Discount' : 'Add Discount (optional)'}
                </button>

                {showDiscount && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount %</label>
                      <input type="number" min="0" max="100" value={form.discountPercent}
                        onChange={(e) => set('discountPercent', e.target.value)} placeholder="10"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">From</label>
                      <input type="date" value={form.discountStart} onChange={(e) => set('discountStart', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Until</label>
                      <input type="date" value={form.discountEnd} onChange={(e) => set('discountEnd', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 transition-all" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={closeModal}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-5 py-2.5 transition-colors">
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

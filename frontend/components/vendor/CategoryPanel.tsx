'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag } from 'lucide-react';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryPanel({ categories, onRefresh }: Props) {
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [formName, setFormName]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  function openCreate() {
    setEditingId(null); setFormName(''); setError(null); setShowForm(true);
  }
  function openEdit(cat: Category) {
    setEditingId(cat.id); setFormName(cat.name); setError(null); setShowForm(true);
  }
  function cancelForm() {
    setShowForm(false); setEditingId(null); setFormName(''); setError(null);
  }

  async function handleSubmit() {
    if (!formName.trim()) { setError('Category name is required'); return; }
    setIsSubmitting(true); setError(null);
    try {
      if (editingId) {
        await api.patch(`/api/vendor/categories/${editingId}`, { name: formName.trim() });
      } else {
        await api.post('/api/vendor/categories', { name: formName.trim() });
      }
      cancelForm(); onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setIsSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category and all its food items? This cannot be undone.')) return;
    setDeletingId(id);
    try { await api.delete(`/api/vendor/categories/${id}`); onRefresh(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Categories</h2>
          <span className="bg-orange-105 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 text-xs font-medium rounded-full px-2 py-0.5 border border-orange-500/10">
            {categories.length}
          </span>
        </div>
        <button id="add-category-btn" onClick={openCreate}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-3 py-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">
            {editingId ? 'Edit Category' : 'New Category'}
          </p>
          <input id="category-name-input" type="text" value={formName}
            onChange={(e) => setFormName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Snacks, Beverages…" autoFocus
            className="w-full border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-gray-950 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          />
          {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button id="category-save-btn" onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg px-3 py-1.5">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editingId ? 'Save' : 'Create'}
            </button>
            <button onClick={cancelForm}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {categories.length === 0 && (
          <div className="flex flex-col items-center py-10 text-gray-400 dark:text-gray-500">
            <Tag className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No categories yet</p>
            <p className="text-xs mt-1">Add one to start building your menu</p>
          </div>
        )}
        {categories.map((cat) => (
          <div key={cat.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 group transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-205 truncate">{cat.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button id={`edit-cat-${cat.id}`} onClick={() => openEdit(cat)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                aria-label={`Edit ${cat.name}`}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button id={`delete-cat-${cat.id}`} onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                aria-label={`Delete ${cat.name}`}>
                {deletingId === cat.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

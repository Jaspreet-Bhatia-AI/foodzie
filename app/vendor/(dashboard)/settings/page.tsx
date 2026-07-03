'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Store, 
  Mail, 
  Phone, 
  GraduationCap, 
  FileText, 
  Save, 
  Loader2, 
  TrendingUp, 
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';

interface VendorData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  universityName: string | null;
  vendorDescription: string | null;
  vendorUpi: string | null;
}

interface Stats {
  totalRevenue: number;
  totalOrders: number;
}

export default function VendorSettingsPage() {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    universityName: '',
    vendorDescription: '',
    vendorUpi: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [user, vendorStats] = await Promise.all([
        api.get<VendorData>('/api/auth/me'),
        api.get<Stats>('/api/orders/vendor/stats')
      ]);
      setVendorData(user);
      setStats(vendorStats);
      setForm({
        name: user.name,
        phone: user.phone || '',
        universityName: user.universityName || '',
        vendorDescription: user.vendorDescription || '',
        vendorUpi: user.vendorUpi || ''
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.patch<VendorData>('/api/auth/me', form);
      setVendorData(updated);
      alert('Settings updated successfully!');
    } catch (err: any) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your canteen profile and view performance</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">${stats.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed Orders</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalOrders}</h3>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-500" /> Canteen Name
              </label>
              <input 
                type="text" 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="The Hot Spot"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" /> Phone Number
              </label>
              <input 
                type="text" 
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-500" /> University
            </label>
            <input 
              type="text" 
              value={form.universityName}
              onChange={(e) => setForm({ ...form, universityName: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="Greenfield Institute"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" /> UPI ID for Payouts
            </label>
            <input 
              type="text" 
              value={form.vendorUpi}
              onChange={(e) => setForm({ ...form, vendorUpi: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="merchant@oksbi"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Provide your GPay/UPI address where the administrator will send your monthly canteen payouts.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" /> Canteen Description
            </label>
            <textarea 
              value={form.vendorDescription}
              onChange={(e) => setForm({ ...form, vendorDescription: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px]"
              placeholder="Freshly prepared snacks and meals for hungry students..."
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

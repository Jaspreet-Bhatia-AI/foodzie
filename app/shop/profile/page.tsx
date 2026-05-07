'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  GraduationCap, 
  History, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  Edit3, 
  Save, 
  X,
  Store,
  Calendar,
  CreditCard
} from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  vendor: {
    vendorName: string;
  };
  items: {
    id: string;
    quantity: number;
    foodItem: {
      name: string;
    };
  }[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  universityName: string | null;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', universityName: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [user, history] = await Promise.all([
        api.get<UserData>('/api/auth/me'),
        api.get<Order[]>('/api/orders/customer')
      ]);
      setUserData(user);
      setOrders(history);
      setEditForm({ name: user.name, universityName: user.universityName || '' });
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.patch<UserData>('/api/auth/me', editForm);
      setUserData(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar / Info Section */}
        <div className="lg:col-span-1 space-y-6">
          <button 
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Shop</span>
          </button>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 relative group">
                <User className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition-colors cursor-pointer flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userData?.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{userData?.email}</p>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="w-full space-y-3">
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Full Name"
                    required
                  />
                  <input 
                    type="text" 
                    value={editForm.universityName}
                    onChange={(e) => setEditForm({ ...editForm, universityName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="University Name"
                  />
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{userData?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{userData?.universityName || 'Not Set'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ThemeToggle /> <span className="text-sm">Appearance</span>
            </h3>
          </div>
        </div>

        {/* Order History Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order History</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{orders.length} total orders</span>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-orange-500/30 transition-colors group">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">{order.vendor.vendorName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span>•</span>
                          <span>#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                        order.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs text-gray-500 truncate max-w-[70%]">
                      {order.items.map(i => `${i.quantity}x ${i.foodItem.name}`).join(', ')}
                    </p>
                    <button className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:gap-2 transition-all">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

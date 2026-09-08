'use client';

import React, { useState, useEffect } from 'react';
import { Inter, Poppins } from 'next/font/google';
import { useTheme } from 'next-themes';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
  LayoutDashboard, Store, Users, ShoppingBag, Settings,
  Search, Bell, Moon, Sun, Menu, X, Plus, Edit2, Trash2,
  ChevronRight, Eye, GripVertical, Check, Key, Mail, Phone, MapPin
} from 'lucide-react';
import { api, setToken, getToken, removeToken } from '@/lib/api';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Check initial token
  useEffect(() => {
    const token = getToken();
    if (token) setIsAuthenticated(true);
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post<{ token: string; user: any }>('/api/auth/login', { email, password });
      if (res.token) {
        setToken(res.token);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Email or Password');
    }
  };

  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center dark:bg-[#020617] bg-[#F8FAFC]">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>Foodzie Admin</h1>
            <p className="text-slate-500 mt-2">Super Admin Access Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Super Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="admin@foodzie.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Enter password" />
            </div>
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/30 mt-4">
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboardContent onLogout={() => { removeToken(); setIsAuthenticated(false); }} />;
}

function AdminDashboardContent({ onLogout }: { onLogout: () => void }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Vendors');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: '', password: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = () => {
    setEditForm({
      name: selectedUser.name || '',
      phone: selectedUser.phone || '',
      email: selectedUser.email || '',
      role: selectedUser.role || '',
      password: ''
    });
    setIsEditing(true);
  };

  const handleUpdateUser = async () => {
    setIsUpdating(true);
    try {
      const updated = await api.patch<any>(`/api/admin/users/${selectedUser.id}`, editForm);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updated } : u));
      setSelectedUser({ ...selectedUser, ...updated });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, analyticsData] = await Promise.all([
          api.get<any[]>('/api/admin/users'),
          api.get<any>('/api/admin/analytics')
        ]);
        setUsers(usersData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const vendors = users.filter(u => u.role === 'Canteen Vendor' || u.role === 'Vendor');
  const students = users.filter(u => u.role === 'Student');

  const navItems = [
    { name: 'Analytics', icon: LayoutDashboard },
    { name: 'Vendors', icon: Store },
    { name: 'Students', icon: Users },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex transition-colors duration-300 ${inter.variable} ${poppins.variable} font-sans`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-poppins)' }}>
            AdminPanel
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.name 
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
            Logout Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'lg:pl-64' : ''} transition-all duration-300`}>
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${isSidebarOpen ? 'hidden' : 'block'}`}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">
              AD
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* VENDORS TAB */}
              {activeTab === 'Vendors' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Canteen Managers</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email (Login ID)</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">University</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {vendors.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => setSelectedUser(v)}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                                  {v.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-white">{v.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{v.email}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{v.university?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center justify-end gap-1 w-full">
                                Manage <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* STUDENTS TAB */}
              {activeTab === 'Students' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registered Students</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">University</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {students.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(s)}>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.email}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.university?.name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'Analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Total Revenue', value: `₹${analytics.metrics?.totalRevenue?.toLocaleString() || 0}`, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
                    { title: 'Total Orders', value: analytics.metrics?.totalOrders || 0, icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
                    { title: 'Active Vendors', value: analytics.metrics?.totalVendors || 0, icon: Store, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
                    { title: 'Total Users', value: analytics.metrics?.totalUsers || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h4>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">University Revenue Comparison</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.universityComparison || []}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                          <XAxis dataKey="name" tick={{ fill: 'gray' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'gray' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal (Slide Over) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setIsEditing(false); }}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col overflow-y-auto animate-in slide-in-from-right">
            <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-8 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-2xl">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h2>
                <span className="inline-block mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                    <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white mb-4">
                      <option value="Student">Student</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">New Password (Optional)</label>
                    <input type="text" placeholder="Leave blank to keep unchanged" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 p-5 rounded-2xl">
                    <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-4">
                      <Key className="w-4 h-4" /> System Credentials
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium uppercase tracking-wider">Login ID (Email)</p>
                        <div className="flex items-center gap-2 mt-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-orange-100 dark:border-orange-500/20">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white select-all">{selectedUser.email}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium uppercase tracking-wider">Default Password</p>
                        <div className="flex items-center gap-2 mt-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-orange-100 dark:border-orange-500/20">
                          <Key className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white select-all">password123</span>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-2">
                        Share these credentials securely with the {selectedUser.role.toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">University</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{selectedUser.university?.name || 'Not Assigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Contact Phone</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{selectedUser.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Account Status</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">Active & Verified</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center">
                    Cancel
                  </button>
                  <button onClick={handleUpdateUser} disabled={isUpdating} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                    {isUpdating ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button onClick={handleEditClick} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

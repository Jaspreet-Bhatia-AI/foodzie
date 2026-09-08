'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  DollarSign, 
  ShieldAlert, 
  Loader2, 
  LogOut, 
  Search, 
  Building,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Lock,
  Calendar,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText,
  Percent,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { api, getToken, removeToken, decodeToken, setToken } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  universityId?: string | null;
  university?: {
    name: string;
  } | null;
  employerId?: string | null;
  workStatus?: string;
  leaveReason?: string | null;
  resignRequest?: number | boolean;
  upi?: string | null;
}

interface AdminOrder {
  id: string;
  customerId: string;
  vendorId: string;
  deliveryPersonId: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  isCOD: boolean;
  paymentReceived: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    universityName?: string | null;
  } | null;
  vendor?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    universityName?: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    priceAtTime: number;
    foodItem: {
      name: string;
      realPrice?: number;
    };
  }[];
}

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const { brandName, toggleBrand } = useBrand();
  const [toggleLoading, setToggleLoading] = useState(false);

  const handleBrandToggle = async () => {
    setToggleLoading(true);
    try {
      const nextBrand = brandName === 'Foodzie' ? 'UniFoodz' : 'Foodzie';
      await toggleBrand(nextBrand);
    } catch (err: any) {
      alert('Failed to update brand setting: ' + (err.response?.data?.error || err.message));
    } finally {
      setToggleLoading(false);
    }
  };
  
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Login Form states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data states
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [universities, setUniversities] = useState<{ id: string; name: string; country?: string; }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'orders'>('analytics');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'Student' | 'Vendor' | 'Delivery' | 'Admin'>('all');
  
  // Interactive Analytics States
  const [selectedUniForAnalytics, setSelectedUniForAnalytics] = useState<string>('');
  const [selectedVendorForAnalytics, setSelectedVendorForAnalytics] = useState<string>('');
  const [commissionMargin, setCommissionMargin] = useState<number>(20);
  const [selectedUniCompareList, setSelectedUniCompareList] = useState<string[]>([]);
  
  // Modals & Forms Overlay state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<AdminOrder | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // User form inputs
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormRole, setUserFormRole] = useState<'Student' | 'Vendor' | 'Delivery' | 'Admin'>('Student');
  const [userFormUniId, setUserFormUniId] = useState('');
  const [userFormEmployerId, setUserFormEmployerId] = useState('');
  const [userFormWorkStatus, setUserFormWorkStatus] = useState('Active');
  const [userFormLeaveReason, setUserFormLeaveReason] = useState('');
  const [userFormResignRequest, setUserFormResignRequest] = useState(false);
  const [userFormUpi, setUserFormUpi] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Verify auth on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAdminLoggedIn(false);
      setIsCheckingAuth(false);
      return;
    }

    const payload = decodeToken<TokenPayload>(token);
    if (payload && payload.role === 'Admin' && payload.exp > Date.now() / 1000) {
      setIsAdminLoggedIn(true);
      fetchAdminData();
    } else {
      setIsAdminLoggedIn(false);
      removeToken();
    }
    setIsCheckingAuth(false);
  }, []);

  const fetchAdminData = async () => {
    setIsLoadingData(true);
    setErrorMsg(null);
    try {
      const [users, orders, unisResponse] = await Promise.all([
        api.get<UserRecord[]>('/api/admin/users'),
        api.get<AdminOrder[]>('/api/admin/orders'),
        api.get<{ universities: { id: string; name: string; country?: string; }[] }>('/api/menu/universities')
      ]);
      setUsersList(users);
      setOrdersList(orders);
      setUniversities(unisResponse.universities || []);
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('expired'))) {
        removeToken();
        setIsAdminLoggedIn(false);
      } else {
        setErrorMsg(err.message || 'Failed to populate admin data modules.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const response = await api.post<{ token: string }>('/api/auth/login', {
        email: adminEmail.trim(),
        password: adminPassword
      });

      const payload = decodeToken<TokenPayload>(response.token);
      if (!payload || payload.role !== 'Admin') {
        throw new Error('Unauthorized. Access limited to Administrators.');
      }

      setToken(response.token);
      setIsAdminLoggedIn(true);
      
      // Load data immediately
      await fetchAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    setAdminPassword('');
  };

  // ─── USER CRUD PROCESSORS ──────────────────────────────────────────────────
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPhone('');
    setUserFormPassword('');
    setUserFormRole('Student');
    setUserFormUniId('');
    setUserFormEmployerId('');
    setUserFormWorkStatus('Active');
    setUserFormLeaveReason('');
    setUserFormResignRequest(false);
    setUserFormUpi('');
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserRecord) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPhone(user.phone || '');
    setUserFormPassword('');
    setUserFormRole(user.role as any);
    setUserFormUniId(user.universityId || '');
    setUserFormEmployerId(user.employerId || '');
    setUserFormWorkStatus(user.workStatus || 'Active');
    setUserFormLeaveReason(user.leaveReason || '');
    setUserFormResignRequest(!!user.resignRequest);
    setUserFormUpi(user.upi || '');
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this account and all associated order logs? This action is permanent!")) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete user account.");
    }
  };

  const handleUserFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserFormLoading(true);

    try {
      const payload = {
        name: userFormName.trim(),
        email: userFormEmail.trim(),
        phone: userFormPhone.trim() || null,
        role: userFormRole,
        universityId: userFormUniId || null,
        employerId: userFormRole === 'Delivery' ? (userFormEmployerId || null) : null,
        workStatus: userFormRole === 'Delivery' ? userFormWorkStatus : 'Active',
        leaveReason: userFormRole === 'Delivery' && userFormWorkStatus === 'Leave' ? userFormLeaveReason : null,
        resignRequest: userFormRole === 'Delivery' ? (userFormResignRequest ? 1 : 0) : 0,
        upi: (userFormRole === 'Delivery' || userFormRole === 'Vendor') ? (userFormUpi.trim() || null) : null,
        ...(userFormPassword ? { password: userFormPassword } : {})
      };

      if (editingUser) {
        await api.patch(`/api/admin/users/${editingUser.id}`, payload);
      } else {
        if (!userFormPassword) {
          throw new Error("Password is required for new users.");
        }
        await api.post('/api/admin/users', payload);
      }

      setIsUserModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setUserFormError(err.message || "Failed to save user account details.");
    } finally {
      setUserFormLoading(false);
    }
  };

  // ─── DATA CALCULATORS & ANALYTICS ──────────────────────────────────────────
  const metrics = useMemo(() => {
    let filteredUsers = usersList;
    let filteredOrders = ordersList;

    if (selectedUniForAnalytics) {
      filteredUsers = filteredUsers.filter(u => u.university?.name === selectedUniForAnalytics);
      filteredOrders = filteredOrders.filter(o => (o.vendor?.universityName || 'Global / Non-Campus') === selectedUniForAnalytics);
    }
    
    if (selectedVendorForAnalytics) {
      // If a vendor is selected, only show that vendor in canteen count, and orders for that vendor
      filteredUsers = filteredUsers.filter(u => u.id === selectedVendorForAnalytics || u.role === 'Student'); 
      filteredOrders = filteredOrders.filter(o => o.vendorId === selectedVendorForAnalytics);
    }

    const totalUsers = filteredUsers.filter(u => u.role === 'Student').length;
    const totalVendors = filteredUsers.filter(u => u.role === 'Vendor').length;
    const totalOrders = filteredOrders.length;
    
    const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const completedCount = completedOrders.length;
    const pendingCount = filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
    const cancelledCount = filteredOrders.filter(o => o.status === 'Cancelled').length;

    return {
      totalUsers,
      totalVendors,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      completedCount,
      pendingCount,
      cancelledCount
    };
  }, [usersList, ordersList, selectedUniForAnalytics, selectedVendorForAnalytics]);

  // 7-DAY REVENUE & ORDER TRENDS
  const dailyTrends = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - idx);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    const revenueMap: { [key: string]: number } = {};
    const orderMap: { [key: string]: number } = {};

    days.forEach(d => {
      revenueMap[d] = 0;
      orderMap[d] = 0;
    });

    ordersList.forEach(o => {
      // Apply interactive filters
      if (selectedUniForAnalytics) {
        const vendorUni = o.vendor?.universityName || 'Global / Non-Campus';
        if (vendorUni !== selectedUniForAnalytics) return;
      }
      if (selectedVendorForAnalytics && o.vendorId !== selectedVendorForAnalytics) return;

      const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateStr in revenueMap) {
        orderMap[dateStr] += 1;
        if (o.status === 'Completed') {
          revenueMap[dateStr] += o.totalAmount;
        }
      }
    });

    const chartData = days.map(d => ({
      name: d,
      revenue: parseFloat(revenueMap[d].toFixed(2)),
      orders: orderMap[d]
    }));

    return chartData;
  }, [ordersList, selectedUniForAnalytics, selectedVendorForAnalytics]);
  // Food Trends (Most Popular Dishes)
  const foodTrends = useMemo(() => {
    const counts: { [name: string]: number } = {};
    ordersList.forEach(o => {
      if (o.status !== 'Cancelled') {
        o.items.forEach(item => {
          const name = item.foodItem?.name || 'Unknown';
          counts[name] = (counts[name] || 0) + item.quantity;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [ordersList]);

  // Location Stats (Orders by University)
  const locationStats = useMemo(() => {
    const counts: { [uniName: string]: number } = {};
    ordersList.forEach(o => {
      if (o.status !== 'Cancelled') {
        const uniName = o.customer?.universityName || 'Global / Non-Campus';
        counts[uniName] = (counts[uniName] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ordersList]);

  // Payment type statistics (COD vs Online)
  const paymentStats = useMemo(() => {
    let cod = 0;
    let online = 0;
    ordersList.forEach(o => {
      if (o.status !== 'Cancelled') {
        if (o.isCOD) {
          cod++;
        } else {
          online++;
        }
      }
    });
    return { cod, online, total: cod + online };
  }, [ordersList]);

  // Interactive Analytics Drilldown Calculations
  const drilldownData = useMemo(() => {
    // 1. Filter orders based on selections
    const filteredOrders = ordersList.filter(o => {
      if (selectedUniForAnalytics) {
        const vendorUni = o.vendor?.universityName || 'Global / Non-Campus';
        if (vendorUni !== selectedUniForAnalytics) return false;
      }
      if (selectedVendorForAnalytics && o.vendorId !== selectedVendorForAnalytics) return false;
      return o.status !== 'Cancelled';
    });

    // Helper to calculate profit of an order item based on realPrice vs priceAtTime
    const getItemProfit = (item: any) => {
      const realP = typeof item.foodItem?.realPrice === 'number' ? item.foodItem.realPrice : (item.priceAtTime * 0.8);
      return (item.priceAtTime - realP) * item.quantity;
    };

    // 2. Aggregate stats
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalProfit = completedOrders.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + getItemProfit(item), 0), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // 3. Compute items breakdown
    const itemSales: { [name: string]: { quantity: number; revenue: number; profit: number } } = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const name = item.foodItem?.name || 'Unknown';
        const qty = item.quantity;
        const itemRev = item.priceAtTime * qty;
        
        if (!itemSales[name]) {
          itemSales[name] = { quantity: 0, revenue: 0, profit: 0 };
        }
        itemSales[name].quantity += qty;
        if (o.status === 'Completed') {
          itemSales[name].revenue += itemRev;
          itemSales[name].profit += getItemProfit(item);
        }
      });
    });

    const foodPerformanceList = Object.entries(itemSales)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
        profit: stats.profit
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 4. Compute vendor breakdown
    const vendorSales: { [id: string]: { name: string; email: string; orders: number; revenue: number; profit: number } } = {};
    filteredOrders.forEach(o => {
      const vId = o.vendorId;
      const vName = o.vendor?.name || 'Unknown Canteen';
      const vEmail = o.vendor?.email || '';
      
      if (!vendorSales[vId]) {
        vendorSales[vId] = { name: vName, email: vEmail, orders: 0, revenue: 0, profit: 0 };
      }
      vendorSales[vId].orders += 1;
      if (o.status === 'Completed') {
        vendorSales[vId].revenue += o.totalAmount;
        vendorSales[vId].profit += o.items.reduce((itemSum, item) => itemSum + getItemProfit(item), 0);
      }
    });

    const vendorPerformanceList = Object.entries(vendorSales)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        email: stats.email,
        orders: stats.orders,
        revenue: stats.revenue,
        profit: stats.profit
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 5. Compute university breakdown
    const universitySales: { [name: string]: { orders: number; revenue: number; profit: number } } = {};
    filteredOrders.forEach(o => {
      const uniName = o.vendor?.universityName || 'Global / Non-Campus';
      if (!universitySales[uniName]) {
        universitySales[uniName] = { orders: 0, revenue: 0, profit: 0 };
      }
      universitySales[uniName].orders += 1;
      if (o.status === 'Completed') {
        universitySales[uniName].revenue += o.totalAmount;
        universitySales[uniName].profit += o.items.reduce((itemSum, item) => itemSum + getItemProfit(item), 0);
      }
    });

    const universityPerformanceList = Object.entries(universitySales)
      .map(([name, stats]) => ({
        name,
        orders: stats.orders,
        revenue: stats.revenue,
        profit: stats.profit
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalOrders,
      totalRevenue,
      totalProfit,
      averageOrderValue,
      foodPerformanceList,
      vendorPerformanceList,
      universityPerformanceList
    };
  }, [ordersList, selectedUniForAnalytics, selectedVendorForAnalytics]);

  // Comparison Engine for Selected Universities
  const universityComparison = useMemo(() => {
    if (selectedUniCompareList.length === 0) return [];
    
    // Helper to calculate profit of an order item based on realPrice vs priceAtTime
    const getItemProfit = (item: any) => {
      const realP = typeof item.foodItem?.realPrice === 'number' ? item.foodItem.realPrice : (item.priceAtTime * 0.8);
      return (item.priceAtTime - realP) * item.quantity;
    };

    return selectedUniCompareList.map(uniName => {
      const uniOrders = ordersList.filter(o => 
        (o.vendor?.universityName || 'Global / Non-Campus') === uniName && o.status !== 'Cancelled'
      );
      const completed = uniOrders.filter(o => o.status === 'Completed');
      const revenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);
      const profit = completed.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + getItemProfit(item), 0), 0);
      
      const dishCounts: { [name: string]: number } = {};
      uniOrders.forEach(o => {
        o.items.forEach(item => {
          const name = item.foodItem?.name || 'Unknown';
          dishCounts[name] = (dishCounts[name] || 0) + item.quantity;
        });
      });
      const topDish = Object.entries(dishCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        name: uniName,
        orders: uniOrders.length,
        revenue,
        profit,
        topDish,
        aov: completed.length > 0 ? revenue / completed.length : 0
      };
    });
  }, [ordersList, selectedUniCompareList]);

  // USER SPECIFIC SUMMARY FOR INSPECTOR MODAL
  const inspectUserData = useMemo(() => {
    if (!selectedUser) return null;
    const isVendor = selectedUser.role === 'Vendor';
    
    const matchedOrders = ordersList.filter(o => 
      isVendor ? o.vendorId === selectedUser.id : o.customerId === selectedUser.id
    );

    const totalOrdersCount = matchedOrders.length;
    const totalFinance = matchedOrders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const averageFinance = totalOrdersCount > 0 ? totalFinance / totalOrdersCount : 0;

    return {
      matchedOrders,
      totalOrdersCount,
      totalFinance,
      averageFinance
    };
  }, [selectedUser, ordersList]);

  // FILTERED LISTS
  const filteredUsersList = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm));
        
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [usersList, searchTerm, userRoleFilter]);

  const filteredOrdersList = useMemo(() => {
    return ordersList.filter(o => {
      const matchSearch = 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customer && o.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.vendor && o.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        o.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [ordersList, searchTerm]);

  // RENDER SECURITY CHECKING LAYER
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen dark:bg-gray-950 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest font-mono">Authenticating secure panel...</p>
      </div>
    );
  }

  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen dark:bg-gray-950 bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -bottom-20 -right-20 pointer-events-none" />

        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-2">Foodzie Admin Gate</h1>
            <p className="text-xs text-gray-550">Access limited to authorized campus networks and system administrators</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-bold">
            <div className="space-y-2">
              <label className="text-gray-405 uppercase text-[9px] tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@foodzie.com"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-405 uppercase text-[9px] tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-950 border border-gray-855 rounded-xl pl-10 pr-12 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 mt-4 text-sm"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER MAIN DASHBOARD INTERFACE
  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 dark:text-gray-300 text-gray-800 flex flex-col font-sans relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* HEADER SECTION */}
      <header className="border-b dark:border-white/5 border-gray-200 dark:bg-gray-900/60 bg-white/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/20">
              F
            </div>
            <div>
              <h1 className="text-base font-bold dark:text-white text-gray-900 tracking-tight">Foodzie Administrator</h1>
              <p className="text-[11px] text-orange-500 font-semibold uppercase tracking-wider">Systems Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-5">

            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ERROR MESSAGE NOTIFICATION */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-6 shrink-0">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-bold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-gray-450 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 overflow-y-auto">
        
        {/* SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          <div className="dark:bg-gradient-to-br dark:from-orange-500/20 dark:via-amber-500/10 dark:to-orange-900/20 bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-100 border border-orange-200 dark:border-orange-400/20 rounded-3xl p-6 space-y-3 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
            <div className="absolute right-4 top-4 text-orange-500/20 group-hover:scale-110 group-hover:text-orange-500/30 transition-all duration-300"><Users className="w-16 h-16" /></div>
            <p className="text-[11px] text-orange-700 dark:text-orange-300/80 uppercase tracking-widest font-semibold font-sans relative z-10">Students</p>
            <h3 className="text-3xl font-bold text-orange-900 dark:text-white relative z-10">{isLoadingData ? '...' : metrics.totalUsers}</h3>
          </div>
          <div className="dark:bg-gradient-to-br dark:from-blue-500/20 dark:via-blue-400/10 dark:to-blue-900/20 bg-gradient-to-br from-blue-50 via-blue-50/50 to-blue-100 border border-blue-200 dark:border-blue-400/20 rounded-3xl p-6 space-y-3 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="absolute right-4 top-4 text-blue-500/20 group-hover:scale-110 group-hover:text-blue-500/30 transition-all duration-300"><Store className="w-16 h-16" /></div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300/80 uppercase tracking-widest font-semibold font-sans relative z-10">Canteens</p>
            <h3 className="text-3xl font-bold text-blue-900 dark:text-white relative z-10">{isLoadingData ? '...' : metrics.totalVendors}</h3>
          </div>
          <div className="dark:bg-gradient-to-br dark:from-emerald-500/20 dark:via-green-400/10 dark:to-emerald-900/20 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-emerald-100 border border-emerald-200 dark:border-emerald-400/20 rounded-3xl p-6 space-y-3 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
            <div className="absolute right-4 top-4 text-emerald-500/20 group-hover:scale-110 group-hover:text-emerald-500/30 transition-all duration-300"><ShoppingBag className="w-16 h-16" /></div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 uppercase tracking-widest font-semibold font-sans relative z-10">Orders Logged</p>
            <h3 className="text-3xl font-bold text-emerald-900 dark:text-white relative z-10">{isLoadingData ? '...' : metrics.totalOrders}</h3>
          </div>
          <div className="dark:bg-gradient-to-br dark:from-orange-500/30 dark:via-amber-400/20 dark:to-orange-800/30 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 border border-orange-300 dark:border-orange-400/30 rounded-3xl p-6 space-y-3 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300">
            <div className="absolute right-4 top-4 text-orange-500/20 group-hover:scale-110 group-hover:text-orange-500/30 transition-all duration-300"><DollarSign className="w-16 h-16" /></div>
            <p className="text-[11px] text-orange-800 dark:text-orange-300 uppercase tracking-widest font-semibold font-sans relative z-10">Revenue</p>
            <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 relative z-10">{isLoadingData ? '...' : formatCurrency(metrics.totalRevenue)}</h3>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 text-[13px] font-semibold shrink-0 dark:bg-gray-900/60 bg-white/80 p-1.5 rounded-2xl w-fit backdrop-blur-md border dark:border-white/5 border-gray-200 relative z-10 shadow-lg">
          <button 
            onClick={() => { setActiveTab('analytics'); setSearchTerm(''); }}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'analytics' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Analytics Engine
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'users' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Accounts Manager
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'orders' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Audit Orders
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {isLoadingData && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-gray-500 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Syncing database assets...</p>
          </div>
        )}

        {!isLoadingData && activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* INTERACTIVE CONTROLS TOOLBAR */}
            <div className="dark:bg-gradient-to-br dark:from-violet-500/10 dark:via-purple-500/5 dark:to-indigo-900/20 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border border-violet-200 dark:border-violet-400/20 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> Interactive Analytics Engine
                  </h2>
                  <p className="text-[13px] text-gray-600 dark:text-violet-200/60 mt-1">Drill down and compare college campuses, canteens, and individual dish logs</p>
                </div>
                
                {(selectedUniForAnalytics || selectedVendorForAnalytics) && (
                  <button
                    onClick={() => { setSelectedUniForAnalytics(''); setSelectedVendorForAnalytics(''); }}
                    className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-violet-400/20 active:scale-95"
                  >
                    Reset Drilldown
                  </button>
                )}
              </div>

              {/* Breadcrumb drill down path */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-2 border-t border-violet-400/10">
                <span 
                  onClick={() => { setSelectedUniForAnalytics(''); setSelectedVendorForAnalytics(''); }}
                  className={`cursor-pointer transition-colors ${!selectedUniForAnalytics ? 'text-orange-500' : 'text-violet-300/60 hover:text-white'}`}
                >
                  🌐 All Colleges
                </span>
                {selectedUniForAnalytics && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-violet-400/40" />
                    <span 
                      onClick={() => setSelectedVendorForAnalytics('')}
                      className={`cursor-pointer transition-colors ${!selectedVendorForAnalytics ? 'text-orange-500' : 'text-violet-300/60 hover:text-white'}`}
                    >
                      🎓 {selectedUniForAnalytics}
                    </span>
                  </>
                )}
                {selectedVendorForAnalytics && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-violet-400/40" />
                    <span className="text-orange-500">
                      🏪 {usersList.find(u => u.id === selectedVendorForAnalytics)?.name || 'Canteen'}
                    </span>
                  </>
                )}
              </div>

              {/* Dropdown Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-violet-400/10">
                <div className="space-y-1.5 text-xs font-bold">
                  <label className="text-violet-700 dark:text-violet-300/70 uppercase text-[9px] tracking-wider block">Campus University</label>
                  <select
                    value={selectedUniForAnalytics}
                    onChange={(e) => { setSelectedUniForAnalytics(e.target.value); setSelectedVendorForAnalytics(''); }}
                    className="w-full bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-400/20 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 font-semibold"
                  >
                    <option value="">All Universities</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.name}>{uni.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-xs font-bold">
                  <label className="text-violet-700 dark:text-violet-300/70 uppercase text-[9px] tracking-wider block">Canteen Vendor</label>
                  <select
                    value={selectedVendorForAnalytics}
                    onChange={(e) => setSelectedVendorForAnalytics(e.target.value)}
                    disabled={!selectedUniForAnalytics}
                    className="w-full bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-400/20 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 font-semibold disabled:opacity-40"
                  >
                    <option value="">All Vendors at Campus</option>
                    {usersList
                      .filter(u => u.role === 'Vendor' && u.university?.name === selectedUniForAnalytics)
                      .map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-xs font-bold bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <label className="text-orange-300/70 uppercase text-[9px] tracking-wider block">Margin Mode</label>
                    <span className="text-green-400 font-black text-[9px] uppercase bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Real Profit</span>
                  </div>
                  <p className="text-[10px] text-orange-200/50 font-normal leading-relaxed mt-1">
                    Calculating profits dynamically using menu cost price (realPrice) vs student purchase price.
                  </p>
                </div>
              </div>
            </div>

            {/* DRILLDOWN KPI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="dark:bg-gradient-to-br dark:from-orange-500/15 dark:to-amber-900/20 bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 dark:border-orange-400/20 rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/15 transition-all duration-300">
                <span className="text-[10px] text-orange-700 dark:text-orange-300/80 font-semibold uppercase tracking-wider">Filtered Revenue</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-orange-900 dark:text-white">{formatCurrency(drilldownData.totalRevenue)}</span>
                </div>
              </div>

              <div className="dark:bg-gradient-to-br dark:from-emerald-500/15 dark:to-green-900/20 bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 dark:border-emerald-400/20 rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-semibold uppercase tracking-wider">Estimated Vendor Profit</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(drilldownData.totalProfit)}</span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-300/50 font-semibold">({commissionMargin}%)</span>
                </div>
              </div>

              <div className="dark:bg-gradient-to-br dark:from-blue-500/15 dark:to-indigo-900/20 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 dark:border-blue-400/20 rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/15 transition-all duration-300">
                <span className="text-[10px] text-blue-700 dark:text-blue-300/80 font-semibold uppercase tracking-wider">Order Volume</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{drilldownData.totalOrders} Orders</span>
                </div>
              </div>

              <div className="dark:bg-gradient-to-br dark:from-violet-500/15 dark:to-purple-900/20 bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 dark:border-violet-400/20 rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/15 transition-all duration-300">
                <span className="text-[10px] text-violet-700 dark:text-violet-300/80 font-semibold uppercase tracking-wider">Average Order Value (AOV)</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-violet-600 dark:text-violet-300">{formatCurrency(drilldownData.averageOrderValue)}</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC VISUAL SVG GRAPHS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Revenue Trends */}
              <div className="dark:bg-gray-900/40 bg-white/80 backdrop-blur-md border dark:border-white/5 border-gray-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold dark:text-white text-gray-900 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-orange-500" /> Revenue Trend</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Sales over past 7 days</p>
                  </div>
                  <span className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl border border-orange-500/20 font-bold">7 Day Sync</span>
                </div>
                
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrends}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#f97316' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Count Trends */}
              <div className="dark:bg-gray-900/40 bg-white/80 backdrop-blur-md border dark:border-white/5 border-gray-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold dark:text-white text-gray-900 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-blue-500" /> Order Volume</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Daily order totals trend</p>
                  </div>
                  <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 font-bold">7 Day Sync</span>
                </div>
                
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#3b82f6' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CAMPUS COMPARISON ENGINE WIDGET */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="font-bold text-white flex items-center gap-1.5">⚖️ College Comparison Engine</h3>
                <p className="text-[10px] text-gray-555 uppercase font-black">Select colleges side-by-side to benchmark performance and metrics</p>
              </div>

              {/* Multi-select Checklist */}
              <div className="flex flex-wrap gap-3 py-2">
                {locationStats.map(uni => {
                  const isChecked = selectedUniCompareList.includes(uni.name);
                  return (
                    <button
                      key={uni.name}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedUniCompareList(prev => prev.filter(x => x !== uni.name));
                        } else {
                          setSelectedUniCompareList(prev => [...prev, uni.name]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        isChecked 
                          ? 'bg-orange-500 border-orange-400 text-white' 
                          : 'bg-gray-955 border-gray-850 text-gray-400 hover:text-white'
                      }`}
                    >
                      {uni.name}
                    </button>
                  );
                })}
              </div>

              {/* Comparison Cards & Charts */}
              {selectedUniCompareList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-850">
                  <div className="space-y-4">
                    <span className="text-[9px] text-gray-550 font-black uppercase tracking-wider block">Comparison Matrix</span>
                    <div className="space-y-3.5">
                      {universityComparison.map(comp => (
                        <div key={comp.name} className="bg-gray-955 border border-gray-855 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-center">
                          <div className="col-span-2 text-left md:col-span-1">
                            <p className="text-white truncate max-w-[120px]" title={comp.name}>{comp.name}</p>
                            <span className="text-[9px] text-gray-555 font-normal">University</span>
                          </div>
                          <div>
                            <p className="text-orange-500 font-black">{formatCurrency(comp.revenue)}</p>
                            <span className="text-[9px] text-gray-555 font-normal">Revenue</span>
                          </div>
                          <div>
                            <p className="text-green-400 font-black">{formatCurrency(comp.profit)}</p>
                            <span className="text-[9px] text-gray-555 font-normal">Profits</span>
                          </div>
                          <div>
                            <p className="text-white font-mono">{comp.orders} orders</p>
                            <span className="text-[9px] text-gray-555 font-normal">Top Dish: {comp.topDish}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparative SVG Bar Chart */}
                  <div className="bg-gray-955 border border-gray-850 p-5 rounded-2xl space-y-4">
                    <span className="text-[9px] text-gray-550 font-black uppercase tracking-wider block">Revenue Comparison Chart</span>
                    <div className="h-44 w-full flex items-end justify-around pt-2">
                      {universityComparison.map((comp, idx) => {
                        const maxRev = Math.max(...universityComparison.map(c => c.revenue), 100);
                        const pctHeight = (comp.revenue / maxRev) * 100;
                        const colors = ['#f97316', '#3b82f6', '#10b981', '#a855f7'];
                        const barColor = colors[idx % colors.length];
                        return (
                          <div key={comp.name} className="flex flex-col items-center gap-2 w-16 text-center">
                            <div className="w-10 bg-gray-900 border border-gray-800 rounded-t-lg h-32 flex items-end">
                              <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${pctHeight}%`, backgroundColor: barColor }} />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold truncate w-14" title={comp.name}>{comp.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC DRILL-DOWN LEDGER TABLES */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
              
              {/* Level Titles */}
              <div className="flex justify-between items-center border-b border-gray-850 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {!selectedUniForAnalytics && 'Whole Network Sales: Campus Leaderboard'}
                    {selectedUniForAnalytics && !selectedVendorForAnalytics && `Canteen Performance: ${selectedUniForAnalytics}`}
                    {selectedVendorForAnalytics && `Menu Sales & Profits: ${usersList.find(u => u.id === selectedVendorForAnalytics)?.name}`}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black">
                    {!selectedUniForAnalytics && 'Leaderboard of university campus sales volumes'}
                    {selectedUniForAnalytics && !selectedVendorForAnalytics && 'Details for canteens at the selected university campus'}
                    {selectedVendorForAnalytics && 'Unit volumes, gross revenue, and profit ledger per dish'}
                  </p>
                </div>
              </div>

              {/* Table rendering based on level */}
              {!selectedUniForAnalytics && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="text-gray-550 border-b border-gray-850 uppercase text-[9px] tracking-wider">
                        <th className="pb-3">University / Campus</th>
                        <th className="pb-3 text-center">Total Orders</th>
                        <th className="pb-3 text-right">Gross Revenue</th>
                        <th className="pb-3 text-right">Estimated Profits</th>
                        <th className="pb-3 text-right">Drill Down</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {drilldownData.universityPerformanceList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-550">No sales logged in university canteens.</td>
                        </tr>
                      ) : (
                        drilldownData.universityPerformanceList.map(uni => (
                          <tr key={uni.name} className="hover:bg-gray-955/50 transition-colors">
                            <td className="py-3.5 font-bold text-white">{uni.name}</td>
                            <td className="py-3.5 text-center text-gray-400">{uni.orders}</td>
                            <td className="py-3.5 text-right text-white font-black">{formatCurrency(uni.revenue)}</td>
                            <td className="py-3.5 text-right text-green-400 font-black">{formatCurrency(uni.profit)}</td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setSelectedUniForAnalytics(uni.name)}
                                className="bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase"
                              >
                                View Canteens
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedUniForAnalytics && !selectedVendorForAnalytics && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="text-gray-550 border-b border-gray-850 uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Canteen / Vendor</th>
                        <th className="pb-3">Contact Email</th>
                        <th className="pb-3 text-center">Total Orders</th>
                        <th className="pb-3 text-right">Gross Revenue</th>
                        <th className="pb-3 text-right">Estimated Profits</th>
                        <th className="pb-3 text-right">Drill Down</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {drilldownData.vendorPerformanceList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-550">No vendors set up or sales logged on this campus.</td>
                        </tr>
                      ) : (
                        drilldownData.vendorPerformanceList.map(vendor => (
                          <tr key={vendor.id} className="hover:bg-gray-955/50 transition-colors">
                            <td className="py-3.5 font-bold text-white">{vendor.name}</td>
                            <td className="py-3.5 text-gray-400">{vendor.email}</td>
                            <td className="py-3.5 text-center text-gray-400">{vendor.orders}</td>
                            <td className="py-3.5 text-right text-white font-black">{formatCurrency(vendor.revenue)}</td>
                            <td className="py-3.5 text-right text-green-400 font-black">{formatCurrency(vendor.profit)}</td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setSelectedVendorForAnalytics(vendor.id)}
                                className="bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase"
                              >
                                View Dishes
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedVendorForAnalytics && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="text-gray-550 border-b border-gray-850 uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Food Item / Dish</th>
                        <th className="pb-3 text-center">Unit Sales Volume</th>
                        <th className="pb-3 text-right">Gross Sales Revenue</th>
                        <th className="pb-3 text-right">Estimated Profits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {drilldownData.foodPerformanceList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-550">No food items sold yet by this vendor.</td>
                        </tr>
                      ) : (
                        drilldownData.foodPerformanceList.map(food => (
                          <tr key={food.name} className="hover:bg-gray-955/50 transition-colors">
                            <td className="py-3.5 font-bold text-white">{food.name}</td>
                            <td className="py-3.5 text-center text-gray-400">{food.quantity} units</td>
                            <td className="py-3.5 text-right text-white font-black">{formatCurrency(food.revenue)}</td>
                            <td className="py-3.5 text-right text-green-400 font-black">{formatCurrency(food.profit)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS & ACCOUNTS MANAGEMENT */}
        {!isLoadingData && activeTab === 'users' && (
          <div className="dark:bg-gray-900/40 bg-white/80 backdrop-blur-md border dark:border-white/5 border-gray-200 rounded-3xl p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white text-gray-900">Registered Accounts</h2>
                <p className="text-xs text-gray-500">Add, edit, or delete platform student and vendor accounts</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={openCreateUserModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg transition-all border border-orange-400/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Account
                </button>

                  <div className="flex dark:bg-gray-950 bg-gray-100 border dark:border-gray-800 border-gray-200 rounded-xl p-1 text-xs font-bold">
                  {(['all', 'Student', 'Vendor', 'Delivery', 'Admin'] as const).map((role) => (
                    <button 
                      key={role}
                      onClick={() => setUserRoleFilter(role)}
                      className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                        userRoleFilter === role ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {role === 'all' ? 'All' : role}
                    </button>
                  ))}
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, email, phone..."
                    className="dark:bg-gray-950 bg-gray-50 border dark:border-gray-800 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-xs w-56 dark:text-white text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border dark:border-emerald-500/10 border-emerald-200/50 rounded-2xl dark:bg-emerald-950/10 bg-emerald-50/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-emerald-500/10 border-emerald-200 text-[10px] dark:text-emerald-300 text-emerald-700 uppercase tracking-widest font-black dark:bg-emerald-900/20 bg-emerald-100/60">
                    <th className="p-4">Name / ID</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Campus / University</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-emerald-500/10 divide-emerald-200/40 text-xs font-semibold">
                  {filteredUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No matching user accounts registered yet.</td>
                    </tr>
                  ) : (
                    filteredUsersList.map(user => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className="dark:hover:bg-emerald-500/5 hover:bg-emerald-50 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <p className="font-bold dark:text-amber-400 text-amber-700 group-hover:text-orange-500 transition-colors">{user.name}</p>
                          <span className="text-[9px] font-mono dark:text-gray-500 text-gray-400">#{user.id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="p-4 dark:text-violet-300 text-violet-700">{user.email}</td>
                        <td className="p-4 dark:text-sky-300 text-sky-700">{user.phone || '—'}</td>
                        <td className="p-4 dark:text-teal-300 text-teal-700 font-bold">{user.university?.name || 'Global / Non-Campus'}</td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                            user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            user.role === 'Vendor' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                            user.role === 'Delivery' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-1.5 text-blue-500 hover:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:scale-105 transition-all"
                              title="Edit User Profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {user.role !== 'Admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-red-500 hover:text-red-450 bg-red-500/10 border border-red-500/20 rounded-lg hover:scale-105 transition-all"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS & ORDERS */}
        {!isLoadingData && activeTab === 'orders' && (
          <div className="dark:bg-gray-900/40 bg-white/80 backdrop-blur-md border dark:border-white/5 border-gray-200 rounded-3xl p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white text-gray-900">Platform Transaction Logs</h2>
                <p className="text-xs text-gray-500">Audit sales transactions, payments, address details, and item counts</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search order ID, student, canteen..."
                  className="dark:bg-gray-950 bg-gray-50 border dark:border-gray-800 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-xs w-64 dark:text-white text-gray-900 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto border dark:border-indigo-500/10 border-indigo-200/50 rounded-2xl dark:bg-indigo-950/10 bg-indigo-50/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-indigo-500/10 border-indigo-200 text-[10px] dark:text-indigo-300 text-indigo-700 uppercase tracking-widest font-black dark:bg-indigo-900/20 bg-indigo-100/60">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Canteen</th>
                    <th className="p-4">Line Items</th>
                    <th className="p-4">Paid Total</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-indigo-500/10 divide-indigo-200/40 text-xs font-semibold">
                  {filteredOrdersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">No transactions recorded in the logs.</td>
                    </tr>
                  ) : (
                    filteredOrdersList.map(order => (
                      <tr 
                        key={order.id} 
                        onClick={() => setInspectingOrder(order)}
                        className="dark:hover:bg-indigo-500/5 hover:bg-indigo-50 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <p className="font-bold dark:text-amber-400 text-amber-600 group-hover:text-orange-500 transition-colors">#F-{order.id.slice(-6).toUpperCase()}</p>
                          <span className="text-[9px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold dark:text-violet-300 text-violet-700">{order.customer?.name || 'Unknown student'}</p>
                          <span className="text-[10px] text-gray-400">{order.customer?.phone || 'No phone'}</span>
                        </td>
                        <td className="p-4 dark:text-teal-300 text-teal-700 font-bold">{order.vendor?.name}</td>
                        <td className="p-4 dark:text-gray-300 text-gray-600 max-w-[150px] truncate">
                          {order.items.map(i => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', ')}
                        </td>
                        <td className="p-4 dark:text-white text-gray-900 font-black">{formatCurrency(order.totalAmount, order.vendorId ? usersList.find(u => u.id === order.vendorId)?.universityId : undefined)}</td>
                        <td className="p-4 dark:text-sky-400 text-sky-700 max-w-[150px] truncate" title={order.deliveryAddress}>
                          {order.deliveryAddress}
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            order.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* USER CRUD MODAL OVERLAY */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-gray-455 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'Edit Account' : 'Create New Account'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Configure profile settings, login credentials, and location bounds
              </p>
            </div>

            {userFormError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 font-medium">
                {userFormError}
              </div>
            )}

            <form onSubmit={handleUserFormSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-450 uppercase text-[9px] tracking-wider block">Account Role</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  <option value="Student">Student (Ordering Customer)</option>
                  <option value="Vendor">Vendor (Canteen Partner)</option>
                  <option value="Delivery">Delivery Rider (Courier)</option>
                  <option value="Admin">Admin (Platform Manager)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="e.g. Jaspreet Bhatia"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  placeholder="e.g. jaspreet@gmail.com"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  value={userFormPhone}
                  onChange={(e) => setUserFormPhone(e.target.value)}
                  placeholder="e.g. +91 99999 99999"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">
                  Password {editingUser && '(Leave blank to retain current)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                  className="w-full bg-gray-955 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Associated University Campus</label>
                <select
                  value={userFormUniId}
                  onChange={(e) => setUserFormUniId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  <option value="">None (Global / Off-Campus Access)</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>

              {/* Vendor & Delivery Specific Fields */}
              {(userFormRole === 'Delivery' || userFormRole === 'Vendor') && (
                <div className="space-y-1.5">
                  <label className="text-gray-455 uppercase text-[9px] tracking-wider block">UPI ID (For Payments)</label>
                  <input
                    type="text"
                    value={userFormUpi}
                    onChange={(e) => setUserFormUpi(e.target.value)}
                    placeholder="e.g. name@upi"
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>
              )}

              {userFormRole === 'Delivery' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Employer Canteen (Vendor)</label>
                    <select
                      value={userFormEmployerId}
                      onChange={(e) => setUserFormEmployerId(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                    >
                      <option value="">None / Unemployed</option>
                      {usersList.filter(u => u.role === 'Vendor').map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Work Status</label>
                      <select
                        value={userFormWorkStatus}
                        onChange={(e) => setUserFormWorkStatus(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                      >
                        <option value="Active">Active</option>
                        <option value="Break">On Break</option>
                        <option value="Leave">On Leave</option>
                        <option value="Resigned">Resigned</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 flex items-end">
                      <label className="flex items-center gap-2 text-gray-300 select-none pb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userFormResignRequest}
                          onChange={(e) => setUserFormResignRequest(e.target.checked)}
                          className="w-4 h-4 bg-gray-950 border-gray-855 rounded text-orange-500 focus:ring-0 cursor-pointer"
                        />
                        <span>Resign Requested</span>
                      </label>
                    </div>
                  </div>

                  {userFormWorkStatus === 'Leave' && (
                    <div className="space-y-1.5">
                      <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Leave Reason / Justification</label>
                      <input
                        type="text"
                        value={userFormLeaveReason}
                        onChange={(e) => setUserFormLeaveReason(e.target.value)}
                        placeholder="Reason for leave"
                        className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex gap-4 font-bold text-xs uppercase">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {userFormLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT USER MODAL OVERLAY */}
      {selectedUser && inspectUserData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-2xl w-full space-y-6 text-left shadow-2xl relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 shrink-0 border-b border-gray-800 pb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                {selectedUser.role === 'Vendor' ? <Store className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
                <span className="text-[10px] text-gray-555 uppercase tracking-widest font-black">{selectedUser.role} Account Profile</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              
              {/* Member Details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-gray-955 border border-gray-850 p-3 rounded-xl">
                  <span className="text-[9px] text-gray-550 uppercase font-black">Email address</span>
                  <p className="font-bold text-white mt-0.5">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-955 border border-gray-850 p-3 rounded-xl">
                  <span className="text-[9px] text-gray-555 uppercase font-black">Phone Number</span>
                  <p className="font-bold text-white mt-0.5">{selectedUser.phone || 'Not Provided'}</p>
                </div>
                <div className="bg-gray-955 border border-gray-855 p-3 rounded-xl col-span-2">
                  <span className="text-[9px] text-gray-555 uppercase font-black">Campus Location</span>
                  <p className="font-bold text-white mt-0.5">{selectedUser.university?.name || 'Global / Non-Campus'}</p>
                </div>
              </div>

              {/* Financial Metrics */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3">Finance Overview</h4>
                <div className="grid grid-cols-3 gap-4 font-bold">
                  <div className="bg-gray-955 border border-gray-855 p-4 rounded-xl text-center">
                    <p className="text-[9px] text-gray-500">Total Orders</p>
                    <span className="text-2xl font-black text-white mt-1 block">{inspectUserData.totalOrdersCount}</span>
                  </div>
                  <div className="bg-gray-955 border border-gray-855 p-4 rounded-xl text-center">
                    <p className="text-[9px] text-gray-500">{selectedUser.role === 'Vendor' ? 'Total Sales' : 'Total Spent'}</p>
                    <span className="text-2xl font-black text-orange-500 mt-1 block">{formatCurrency(inspectUserData.totalFinance, selectedUser?.universityId)}</span>
                  </div>
                  <div className="bg-gray-955 border border-gray-855 p-4 rounded-xl text-center">
                    <p className="text-[9px] text-gray-500">{selectedUser.role === 'Vendor' ? 'AOV' : 'Avg Spend / Order'}</p>
                    <span className="text-2xl font-black text-white mt-1 block">{formatCurrency(inspectUserData.averageFinance, selectedUser?.universityId)}</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3">Order History Logs</h4>
                <div className="border border-gray-855 rounded-2xl bg-gray-955 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-855 text-[9px] text-gray-500 uppercase font-black bg-gray-900/35">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">{selectedUser.role === 'Vendor' ? 'Student' : 'Canteen'}</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Paid Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-855 font-semibold text-gray-300">
                      {inspectUserData.matchedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 text-xs">No orders logged for this member yet.</td>
                        </tr>
                      ) : (
                        inspectUserData.matchedOrders.map(o => (
                          <tr key={o.id}>
                            <td className="p-3 text-white font-bold">#F-{o.id.slice(-6).toUpperCase()}</td>
                            <td className="p-3">{selectedUser.role === 'Vendor' ? o.customer?.name : o.vendor?.name}</td>
                            <td className="p-3 text-[10px] text-gray-500 max-w-[120px] truncate">
                              {o.items.map(i => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', ')}
                            </td>
                            <td className="p-3 text-white">{formatCurrency(o.totalAmount, selectedUser?.universityId)}</td>
                            <td className="p-3">
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                o.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                                o.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* INSPECT ORDER MODAL OVERLAY */}
      {inspectingOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-lg w-full space-y-6 text-left shadow-2xl relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setInspectingOrder(null)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 shrink-0 border-b border-gray-800 pb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Order #F-{inspectingOrder.id.slice(-6).toUpperCase()}</h3>
                <span className="text-[10px] text-gray-555 uppercase tracking-widest font-black">Logged: {new Date(inspectingOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-xs text-gray-300 font-semibold">
              
              {/* Order Status */}
              <div className="bg-gray-955 border border-gray-855 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-black">Fulfillment Status</p>
                  <span className="font-bold text-white mt-1 block">{inspectingOrder.status}</span>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  inspectingOrder.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                  inspectingOrder.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {inspectingOrder.status}
                </span>
              </div>

              {/* Customer & Vendor Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-955 border border-gray-850 p-3 rounded-xl">
                  <span className="text-[9px] text-gray-500 uppercase font-black">Customer (Student)</span>
                  <p className="font-bold text-white mt-0.5">{inspectingOrder.customer?.name || 'Unknown User'}</p>
                  <p className="text-gray-500 mt-1">{inspectingOrder.customer?.email}</p>
                  <p className="text-gray-500">{inspectingOrder.customer?.phone || 'No phone'}</p>
                  {inspectingOrder.customer?.universityName && (
                    <p className="text-orange-400 font-bold mt-1 text-[10px]">{inspectingOrder.customer.universityName}</p>
                  )}
                </div>
                <div className="bg-gray-955 border border-gray-850 p-3 rounded-xl">
                  <span className="text-[9px] text-gray-500 uppercase font-black">Canteen Vendor</span>
                  <p className="font-bold text-white mt-0.5">{inspectingOrder.vendor?.name || 'Unknown Canteen'}</p>
                  <p className="text-gray-500 mt-1">{inspectingOrder.vendor?.email}</p>
                  <p className="text-gray-500">{inspectingOrder.vendor?.phone || 'No phone'}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Order Line Items</h4>
                <div className="border border-gray-855 rounded-2xl bg-gray-955 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-855 text-[9px] text-gray-500 uppercase font-black bg-gray-900/35">
                        <th className="p-3">Item Name</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-855 font-semibold text-gray-300">
                      {inspectingOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 text-white font-bold">{item.foodItem?.name || 'Unknown Dish'}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">{formatCurrency(item.priceAtTime, inspectingOrder?.vendorId ? usersList.find(u => u.id === inspectingOrder.vendorId)?.universityId : undefined)}</td>
                          <td className="p-3 text-right text-white">{formatCurrency(item.quantity * item.priceAtTime, inspectingOrder?.vendorId ? usersList.find(u => u.id === inspectingOrder.vendorId)?.universityId : undefined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-gray-955 border border-gray-855 p-4 rounded-xl space-y-2">
                <div>
                  <span className="text-[9px] text-gray-550 uppercase font-black">Delivery Location Address</span>
                  <p className="font-bold text-white mt-0.5">{inspectingOrder.deliveryAddress}</p>
                </div>
                <div className="grid grid-cols-2 pt-2 border-t border-gray-850 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-550 uppercase font-black">Payment Method</span>
                    <p className="font-bold text-orange-400 mt-0.5">{inspectingOrder.isCOD ? 'Cash on Delivery (COD)' : 'Direct UPI Transfer'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-555 uppercase font-black">Receipt Settled</span>
                    <p className="font-bold mt-0.5 text-white">{inspectingOrder.paymentReceived ? 'Paid (Settled)' : 'Pending'}</p>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center text-base font-black text-white pt-2 border-t border-gray-800 shrink-0">
                <span>TOTAL TRANSACTION AMOUNT</span>
                <span className="text-orange-500">{formatCurrency(inspectingOrder.totalAmount, inspectingOrder?.vendorId ? usersList.find(u => u.id === inspectingOrder.vendorId)?.universityId : undefined)}</span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

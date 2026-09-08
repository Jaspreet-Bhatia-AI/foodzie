'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  CheckCircle, 
  Calendar, 
  AlertTriangle, 
  LogOut, 
  X, 
  Loader2, 
  Coffee, 
  Activity, 
  UserMinus, 
  Check, 
  Phone,
  User, 
  MapPin, 
  CreditCard,
  Store,
  QrCode
} from 'lucide-react';
import { api, getToken, removeToken, decodeToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCurrency } from '@/context/CurrencyContext';

interface AssignedOrder {
  id: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  isCOD: boolean;
  paymentReceived: boolean;
  createdAt: string;
  customer: {
    name: string;
    phone: string | null;
  };
  vendor: {
    name: string;
    phone: string | null;
  };
  items: {
    id: string;
    quantity: number;
    priceAtTime: number;
    foodItem: {
      name: string;
    };
  }[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  workStatus: string;
  leaveReason: string | null;
  resignRequest: boolean;
  upi: string | null;
}

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const { formatCurrency, getCurrencySymbol } = useCurrency();

  // Loading states
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tabs & Stats states
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [statsData, setStatsData] = useState<{
    stats: { completedDeliveries: number; totalEarnings: number; pendingCashCOD: number };
    chart: { date: string; deliveries: number; earnings: number }[];
    history: AssignedOrder[];
  } | null>(null);

  // Scanner states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanningOrderId, setScanningOrderId] = useState<string | null>(null);
  const [scanInputCode, setScanInputCode] = useState('');
  const [simulatingScan, setSimulatingScan] = useState(false);

  // Cash drop states
  const [deposits, setDeposits] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Form inputs
  const [newUpi, setNewUpi] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [updatingUpi, setUpdatingUpi] = useState(false);

  const [leaveReason, setLeaveReason] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Auth verify
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const payload = decodeToken<TokenPayload>(token);
    if (payload && payload.role === 'Delivery' && payload.exp > Date.now() / 1000) {
      fetchDashboardData();
    } else {
      removeToken();
      router.replace('/login');
    }
  }, []);

  // Live location tracking
  useEffect(() => {
    if (!profile) return;
    
    let watchId: number | null = null;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.patch('/api/delivery/location', { lat: latitude, lng: longitude });
            console.log('Location synchronized:', latitude, longitude);
          } catch (err) {
            console.error('Failed to sync location:', err);
          }
        },
        (error) => {
          console.warn('Geolocation permission error or tracking failure:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const [profileData, ordersData, statsResult, depositsResult] = await Promise.all([
        api.get<UserProfile>('/api/auth/me'),
        api.get<AssignedOrder[]>('/api/delivery/orders'),
        api.get<{
          stats: { completedDeliveries: number; totalEarnings: number; pendingCashCOD: number };
          chart: { date: string; deliveries: number; earnings: number }[];
          history: AssignedOrder[];
        }>('/api/delivery/stats'),
        api.get<any[]>('/api/delivery/deposits').catch(() => [])
      ]);
      setProfile(profileData);
      setOrders(ordersData);
      setStatsData(statsResult);
      setDeposits(depositsResult);
      if (profileData.upi) {
        setNewUpi(profileData.upi);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync delivery dashboard details.');
    } finally {
      setLoadingData(false);
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/login');
  };

  // Status handlers
  const handleToggleBreak = async () => {
    if (!profile) return;
    setSubmittingStatus(true);
    try {
      const nextStatus = profile.workStatus === 'Break' ? 'Active' : 'Break';
      await api.patch('/api/delivery/status', { workStatus: nextStatus });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle break status.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    setSubmittingStatus(true);
    try {
      await api.patch('/api/delivery/status', { workStatus: 'Leave', leaveReason: leaveReason.trim() });
      setShowLeaveModal(false);
      setLeaveReason('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to request leave.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleEndLeave = async () => {
    setSubmittingStatus(true);
    try {
      await api.patch('/api/delivery/status', { workStatus: 'Active' });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to end leave status.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleResignRequest = async () => {
    if (!confirm("Are you sure you want to raise a resignation request? This will alert your vendor employer.")) return;
    setSubmittingStatus(true);
    try {
      await api.post('/api/delivery/resign', {});
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to request resignation.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpi.trim()) return;
    setUpdatingUpi(true);
    try {
      await api.patch('/api/delivery/upi', { upi: newUpi.trim() });
      setShowUpiModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to update UPI ID.");
    } finally {
      setUpdatingUpi(false);
    }
  };

  const handlePickOrder = async (orderId: string) => {
    try {
      await api.patch(`/api/delivery/orders/${orderId}/pick`, {});
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to pick up order.");
    }
  };

  const handleDeliverConfirm = async (orderId: string, inputCode: string) => {
    const expectedCode = `F-${orderId.slice(-6).toUpperCase()}`;
    const cleanInput = inputCode.trim().toUpperCase();

    if (cleanInput !== expectedCode && cleanInput !== orderId.toUpperCase() && cleanInput !== orderId.slice(-6).toUpperCase()) {
      alert(`Invalid confirmation barcode/slip ID! It must match the order format (e.g. F-${orderId.slice(-6).toUpperCase()})`);
      return;
    }

    setSimulatingScan(true);
    try {
      await api.patch(`/api/delivery/orders/${orderId}/deliver`, {});
      setShowScanModal(false);
      setScanInputCode('');
      setScanningOrderId(null);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to confirm delivery.");
    } finally {
      setSimulatingScan(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid cash deposit amount.");
      return;
    }

    setSubmittingDeposit(true);
    try {
      await api.post('/api/delivery/deposit', { amount: amountVal });
      setShowDepositModal(false);
      setDepositAmount('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to submit cash deposit drop.");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-955 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest font-mono">Verifying courier portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-gray-900 bg-gray-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg">
              R
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-wider">{profile?.name}</h1>
              <span className="text-[10px] text-orange-400 uppercase font-black">Rider Delivery Employee</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="bg-gray-900 border border-gray-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* BLINKING SALARY WARNING (IF NO UPI SET UP) */}
      {!profile?.upi && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 animate-pulse shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-orange-400 font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              <span>No salary UPI address configured! Add your UPI address now to receive payout payouts from your vendor.</span>
            </div>
            <button 
              onClick={() => setShowUpiModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] uppercase shadow-md active:scale-95 transition-all"
            >
              Configure UPI
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6 overflow-y-auto">
        
        {/* TOP STATUS BAR & UPI BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* UPI Address card */}
          <div className="bg-gray-900 border border-gray-850 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Salary Payout UPI</span>
              <CreditCard className="w-4 h-4 text-gray-655" />
            </div>
            <div>
              {profile?.upi ? (
                <p className="font-mono font-bold text-white text-sm bg-gray-955 border border-gray-850 px-3 py-2 rounded-xl break-all">
                  {profile.upi}
                </p>
              ) : (
                <p className="text-xs text-orange-400 font-bold">⚠️ UPI not configured</p>
              )}
            </div>
            <button
              onClick={() => setShowUpiModal(true)}
              className="w-full bg-gray-955 hover:bg-gray-850 text-xs font-bold py-2 rounded-xl border border-gray-850 transition-colors"
            >
              {profile?.upi ? 'Edit UPI Address' : 'Configure UPI Address'}
            </button>
          </div>

          {/* Availability Status card */}
          <div className="bg-gray-900 border border-gray-855 rounded-3xl p-5 flex flex-col justify-between space-y-4 col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Availability Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  profile?.workStatus === 'Active' ? 'bg-green-500' :
                  profile?.workStatus === 'Break' ? 'bg-orange-50 text-orange-400' :
                  'bg-red-500'
                }`} />
                <span className="text-xs font-bold text-white uppercase">{profile?.workStatus}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {profile?.workStatus === 'Leave' ? (
                <button
                  onClick={handleEndLeave}
                  disabled={submittingStatus}
                  className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Activity className="w-4 h-4" /> End Leave / Back to Work
                </button>
              ) : (
                <>
                  <button
                    onClick={handleToggleBreak}
                    disabled={submittingStatus}
                    className={`flex-1 min-w-[120px] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      profile?.workStatus === 'Break' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                    }`}
                  >
                    <Coffee className="w-4 h-4" /> {profile?.workStatus === 'Break' ? 'End Break' : 'Take a Break'}
                  </button>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    disabled={submittingStatus}
                    className="flex-1 min-w-[120px] bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Calendar className="w-4 h-4" /> Request Leave
                  </button>
                </>
              )}

              <button
                onClick={handleResignRequest}
                disabled={submittingStatus || profile?.resignRequest}
                className={`flex-1 min-w-[140px] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  profile?.resignRequest 
                    ? 'bg-gray-800 text-gray-500 border border-gray-700/20 cursor-not-allowed' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                }`}
              >
                <UserMinus className="w-4 h-4" /> {profile?.resignRequest ? 'Resignation Pending' : 'Submit Resignation'}
              </button>
            </div>
            
            {profile?.workStatus === 'Leave' && profile.leaveReason && (
              <p className="text-[10px] text-blue-400 font-bold bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl">
                📝 Leave Reason: "{profile.leaveReason}"
              </p>
            )}
          </div>

        </div>

        {/* TABS SWITCHER */}
        <div className="flex border-b border-gray-900 bg-gray-900/10 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Active Deliveries ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Trips & Earnings
          </button>
        </div>

        {activeTab === 'active' ? (
          /* ACTIVE DELIVERIES TAB */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4.5 h-4.5 text-orange-500" /> Active Deliveries ({orders.length})
              </h2>
              {loadingData && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
            </div>

            {orders.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-550 space-y-2">
                <CheckCircle className="w-12 h-12 text-gray-700 mx-auto" />
                <h3 className="font-bold text-white text-sm">No Active Deliveries</h3>
                <p className="text-xs max-w-xs mx-auto">You're fully caught up! New orders prepared by your canteen will auto-assign here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-gray-900 border border-gray-850 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                    
                    {/* Order Top Bar */}
                    <div className="flex justify-between items-start border-b border-gray-850 pb-3">
                      <div>
                        <span className="text-[10px] text-gray-550 uppercase tracking-widest font-black">Order ID</span>
                        <p className="font-bold text-white">#F-{order.id.slice(-6).toUpperCase()}</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase bg-blue-500/10 text-blue-400">
                        {order.status === 'OutForDelivery' ? 'On the Way' : order.status}
                      </span>
                    </div>

                    {/* Order Details list */}
                    <div className="space-y-3.5 text-xs text-gray-300">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] text-gray-550 uppercase font-black block">Drop Address</span>
                          <p className="font-bold text-white mt-0.5">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5">
                          <User className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-gray-550 uppercase font-black block">Student Client</span>
                            <p className="font-bold text-white">{order.customer.name}</p>
                            <a 
                              href={`tel:${order.customer.phone}`} 
                              className="text-[10px] text-orange-400 font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <Phone className="w-3 h-3" /> {order.customer.phone || 'No phone'}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Store className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-gray-550 uppercase font-black block">Origin Vendor</span>
                            <p className="font-bold text-white">{order.vendor.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ordered Items summary */}
                      <div className="pt-2 border-t border-gray-850">
                        <span className="text-[9px] text-gray-550 uppercase font-black block mb-1">Items to Deliver</span>
                        <ul className="space-y-1 font-mono text-[11px] text-gray-400">
                          {order.items.map(item => (
                            <li key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.foodItem.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Payment Details & Complete Delivery Button */}
                    <div className="pt-4 border-t border-gray-850 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-gray-550 uppercase font-black block">Payment mode</span>
                          <span className="font-bold text-white">{order.isCOD ? '💵 Cash on Delivery (COD)' : '📱 Paid via UPI'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-550 uppercase font-black block">Amount to Collect</span>
                          <span className="font-black text-orange-500">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>

                      {order.status !== 'OutForDelivery' ? (
                        <button
                          onClick={() => handlePickOrder(order.id)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 active:scale-98 transition-all uppercase text-xs"
                        >
                          <Check className="w-4 h-4" /> Mark as Picked Up / Start Delivery
                        </button>
                      ) : (
                        <button
                          onClick={() => { setScanningOrderId(order.id); setShowScanModal(true); }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-600/10 active:scale-98 transition-all uppercase text-xs"
                        >
                          <QrCode className="w-4 h-4 animate-pulse" /> Scan Confirmation Code to Deliver
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TRIPS AND EARNINGS TAB */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gray-900 border border-gray-850 rounded-3xl p-6 space-y-2 shadow-sm">
                <span className="text-[10px] text-gray-550 font-black uppercase tracking-wider block">Completed Trips</span>
                <h3 className="text-3xl font-black text-blue-400">{statsData?.stats.completedDeliveries ?? 0} Trips</h3>
                <p className="text-[11px] text-gray-500">Total successfully delivered orders</p>
              </div>

              <div className="bg-gray-900 border border-gray-850 rounded-3xl p-6 space-y-2 shadow-sm">
                <span className="text-[10px] text-gray-550 font-black uppercase tracking-wider block">Total Earnings</span>
                <h3 className="text-3xl font-black text-green-400">{formatCurrency(statsData?.stats.totalEarnings ?? 0)}</h3>
                <p className="text-[11px] text-gray-500">Accumulated flat trip rate ({formatCurrency(25)}/order)</p>
              </div>

              <div className="bg-gray-900 border border-gray-850 rounded-3xl p-6 space-y-2 shadow-sm">
                <span className="text-[10px] text-gray-550 font-black uppercase tracking-wider block">Collected COD Cash</span>
                <h3 className="text-3xl font-black text-orange-400">{formatCurrency(statsData?.stats.pendingCashCOD ?? 0)}</h3>
                <p className="text-[11px] text-gray-500">Collected Cash due to return to canteen</p>
              </div>
            </div>

            {/* PERFORMANCE CHART */}
            <div className="bg-gray-900 border border-gray-850 rounded-3xl p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">7-Day Trip History</h3>
                <p className="text-xs text-gray-500 mt-1">Daily count of completed deliveries and trip earnings</p>
              </div>

              <div className="h-48 flex items-end gap-3 pt-6 border-b border-gray-800 pb-2">
                {statsData?.chart.map((day, idx) => {
                  const maxVal = Math.max(...(statsData.chart.map(c => c.deliveries) || [1]));
                  const heightPercent = maxVal > 0 ? (day.deliveries / maxVal) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 bg-gray-950 border border-gray-800 px-3 py-2 rounded-xl text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 whitespace-nowrap text-center shadow-2xl">
                        <p className="font-extrabold">{day.deliveries} deliveries</p>
                        <p className="text-green-400 font-black">{formatCurrency(day.earnings)} earned</p>
                      </div>

                      {/* Bar */}
                      <div 
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          day.deliveries > 0 
                            ? 'bg-orange-500 group-hover:bg-orange-400 shadow-md shadow-orange-500/20' 
                            : 'bg-gray-850'
                        }`}
                      />

                      {/* Date label */}
                      <span className="text-[9px] font-bold text-gray-500 mt-2 truncate w-full text-center">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TRIP RECORDS TABLE */}
            <div className="bg-gray-900 border border-gray-850 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Historical Trip Records</h3>
                <p className="text-xs text-gray-500 mt-1">All historical assigned deliveries and payout statuses</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                      <th className="py-3 px-4">Trip ID</th>
                      <th className="py-3 px-4">Origin Canteen</th>
                      <th className="py-3 px-4">Client Address</th>
                      <th className="py-3 px-4">Payment Info</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Trip Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 text-gray-300 font-semibold">
                    {statsData?.history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">No completed trips found in your account history.</td>
                      </tr>
                    ) : (
                      statsData?.history.map(trip => (
                        <tr key={trip.id} className="hover:bg-gray-955/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-white">#F-{trip.id.slice(-6).toUpperCase()}</td>
                          <td className="py-3.5 px-4">{trip.vendor.name}</td>
                          <td className="py-3.5 px-4 truncate max-w-[150px]">{trip.deliveryAddress}</td>
                          <td className="py-3.5 px-4">
                            <span className="block text-[10px]">{trip.isCOD ? '💵 COD Cash' : '📱 Pre-paid UPI'}</span>
                            <span className="text-[10px] text-gray-550 font-mono">Total: {formatCurrency(trip.totalAmount)}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              trip.status === 'Delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/10' :
                              trip.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                            }`}>
                              {trip.status === 'OutForDelivery' ? 'On the Way' : trip.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-green-400 font-bold">
                            {trip.status === 'Delivered' ? formatCurrency(25) : formatCurrency(0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CASH DEPOSITS & DROPS */}
            <div className="bg-gray-900 border border-gray-855 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    💵 Cash Deposit Drops
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Log cash dropped off physically at the canteen shop</p>
                </div>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all uppercase"
                >
                  Drop Cash at Shop
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-550 uppercase tracking-widest font-black">
                      <th className="py-3 px-4">Deposit ID</th>
                      <th className="py-3 px-4">Recipient Shop</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 text-gray-300 font-semibold">
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No cash deposit logs recorded yet.</td>
                      </tr>
                    ) : (
                      deposits.map(dep => (
                        <tr key={dep.id} className="hover:bg-gray-955/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-white">#D-{dep.id.slice(-6).toUpperCase()}</td>
                          <td className="py-3.5 px-4">{dep.vendorName}</td>
                          <td className="py-3.5 px-4 text-orange-400 font-extrabold">{formatCurrency(parseFloat(dep.amount))}</td>
                          <td className="py-3.5 px-4">{new Date(dep.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              dep.status === 'Verified' ? 'bg-green-500/10 text-green-400 border border-green-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                            }`}>
                              {dep.status}
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
        )}

      </main>

      {/* UPDATE UPI MODAL */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Configure UPI Address</h3>
              <p className="text-xs text-gray-500 mt-1">Set your personal UPI address to receive salary payments directly.</p>
            </div>

            <form onSubmit={handleUpiSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Your UPI ID</label>
                <input
                  type="text"
                  required
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  placeholder="e.g. mobile@ybl or rider@oksbi"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowUpiModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUpi}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {updatingUpi && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save UPI ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Submit Leave Request</h3>
              <p className="text-xs text-gray-500 mt-1">Specify your leave dates or justification reason for your canteen employer.</p>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Justification Reason</label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Unwell today / Emergency leave for July 8th..."
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold resize-none"
                />
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {submittingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE / QR SCANNER MODAL */}
      {showScanModal && scanningOrderId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 text-left shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => { setShowScanModal(false); setScanInputCode(''); setScanningOrderId(null); }}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-500" /> Confirm Order Delivery
              </h3>
              <p className="text-xs text-gray-500 mt-1">Scan the customer's barcode confirmation slip to complete delivery.</p>
            </div>

            {/* SCANNER CAMERA CAMERA PREVIEW SIMULATION */}
            <div className="relative border border-orange-500/30 rounded-2xl overflow-hidden aspect-video bg-gray-950 flex flex-col items-center justify-center space-y-2">
              {/* Scan laser line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-md shadow-red-500/50 animate-bounce top-0" style={{ animationDuration: '3s' }} />
              
              <div className="absolute inset-4 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
                <span className="text-[10px] text-gray-550 font-black uppercase tracking-wider block">Camera Active</span>
                <span className="text-[9px] text-orange-400/80 mt-1 block">Searching for barcode...</span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Slip Confirmation ID / Order ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={scanInputCode}
                    onChange={(e) => setScanInputCode(e.target.value)}
                    placeholder={`e.g. F-${scanningOrderId.slice(-6).toUpperCase()}`}
                    className="flex-1 bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-mono text-center font-bold tracking-widest uppercase"
                  />
                  <button
                    onClick={() => setScanInputCode(`F-${scanningOrderId.slice(-6).toUpperCase()}`)}
                    className="bg-gray-850 hover:bg-gray-800 border border-gray-800 px-3.5 rounded-xl text-[10px] uppercase text-gray-300 font-black active:scale-95 transition-all"
                  >
                    Auto Fill
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => { setShowScanModal(false); setScanInputCode(''); setScanningOrderId(null); }}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeliverConfirm(scanningOrderId, scanInputCode)}
                  disabled={simulatingScan || !scanInputCode.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {simulatingScan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CASH DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Drop Cash at Canteen</h3>
              <p className="text-xs text-gray-500 mt-1">Specify how much collected COD cash you have dropped off at the shop.</p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Deposit Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-gray-955 border border-gray-850 rounded-xl p-3 pl-8 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {submittingDeposit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

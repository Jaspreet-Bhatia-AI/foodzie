'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { io, Socket } from 'socket.io-client';
import { api, getToken, decodeToken } from '@/lib/api';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Bell, 
  User, 
  Receipt,
  Loader2,
  AlertCircle,
  Play
} from 'lucide-react';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

interface OrderItem {
  id: string;
  foodItemId: string;
  quantity: number;
  priceAtTime: number;
  foodItem: {
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OutForDelivery' | 'Completed' | 'Cancelled';
  paymentReceived: boolean;
  createdAt: string;
  deliveryAddress: string;
  isCOD: boolean;
  scheduledTime?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  deliveryPerson?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  items: OrderItem[];
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function VendorOrdersPage() {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riderCoords, setRiderCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<Order[]>('/api/orders/vendor');
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Initialize notification sound
    audioRef.current = new Audio(NOTIFICATION_SOUND);

    // Initialize Socket.io
    const token = getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('newOrder', (newOrder: Order) => {
      console.log('New order received!', newOrder);
      setOrders((prev) => [newOrder, ...prev]);
      
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
      }
    });

    socket.on('delivery:location', (data: { orderId: string; lat: number; lng: number }) => {
      console.log('Rider location update for vendor:', data);
      setRiderCoords((prev) => ({
        ...prev,
        [data.orderId]: { lat: data.lat, lng: data.lng }
      }));
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders]);

  useEffect(() => {
    if (!socketRef.current) return;
    orders.forEach(order => {
      if (order.status === 'OutForDelivery' && order.deliveryPerson?.id) {
        socketRef.current?.emit('track:subscribe', { orderId: order.id });

        if (!riderCoords[order.id]) {
          api.get<{ lat: number; lng: number }>(`/api/delivery/location/${order.deliveryPerson.id}`)
            .then(coords => {
              setRiderCoords(prev => ({ ...prev, [order.id]: coords }));
            })
            .catch(err => console.warn("Rider location not cached yet:", err.message));
        }
      }
    });
  }, [orders, socketRef.current]);

  const [delayingOrderId, setDelayingOrderId] = useState<string | null>(null);
  
  const handleDelay = async (orderId: string) => {
    setDelayingOrderId(orderId);
    try {
      await api.post(`/api/orders/${orderId}/delay`, { delayMinutes: 15 });
      alert("Student notified of a 15-minute delay.");
    } catch (err: any) {
      alert("Failed to delay order: " + err.message);
    } finally {
      setDelayingOrderId(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    // Save original state for rollback on error
    const originalOrders = [...orders];

    // Optimistically update orders in the UI immediately
    setOrders((prev) => 
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );

    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
    } catch (err: any) {
      // Rollback to original orders state on failure
      setOrders(originalOrders);
      alert('Failed to update status: ' + err.message);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Preparing': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredOrders = {
    unverified: orders.filter(o => o.status === 'Pending'),
    pending: orders.filter(o => o.status === 'Confirmed'),
    preparing: orders.filter(o => o.status === 'Preparing'),
    completed: orders.filter(o => ['Ready', 'OutForDelivery', 'Completed'].includes(o.status))
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-gray-500 font-medium">Loading live kitchen dashboard...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kitchen Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage live orders in real-time</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold">Live Connection Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Verification Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />
            <h2 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm">Verify Payment ({filteredOrders.unverified.length})</h2>
          </div>
          <div className="space-y-4 min-h-[500px] p-2 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
            {filteredOrders.unverified.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Receipt className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No pending payments</p>
              </div>
            )}
            {filteredOrders.unverified.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} riderCoords={riderCoords} />
            ))}
          </div>
        </div>

        {/* New / Pending Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm">New Orders ({filteredOrders.pending.length})</h2>
          </div>
          <div className="space-y-4 min-h-[500px] p-2 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
            {filteredOrders.pending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Receipt className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No new orders</p>
              </div>
            )}
            {filteredOrders.pending.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} riderCoords={riderCoords} />
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm">Preparing ({filteredOrders.preparing.length})</h2>
          </div>
          <div className="space-y-4 min-h-[500px] p-2 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
            {filteredOrders.preparing.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Nothing in prep</p>
              </div>
            )}
            {filteredOrders.preparing.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} riderCoords={riderCoords} />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm">Completed ({filteredOrders.completed.length})</h2>
          </div>
          <div className="space-y-4 min-h-[500px] p-2 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
            {filteredOrders.completed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No completed orders</p>
              </div>
            )}
            {filteredOrders.completed.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} riderCoords={riderCoords} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ 
  order, 
  onUpdateStatus, 
  riderCoords 
}: { 
  order: Order; 
  onUpdateStatus: (id: string, s: Order['status']) => void; 
  riderCoords: Record<string, { lat: number; lng: number }>;
}) {
  const { formatCurrency } = useCurrency();
  const getStatusBorder = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'border-l-4 border-l-yellow-500';
      case 'Confirmed': return 'border-l-4 border-l-blue-500';
      case 'Preparing': return 'border-l-4 border-l-orange-500';
      case 'Ready': return 'border-l-4 border-l-green-500';
      case 'OutForDelivery': return 'border-l-4 border-l-indigo-500';
      default: return 'border-l-4 border-l-gray-400 dark:border-l-gray-600';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900/40 rounded-2xl p-4 shadow-sm border border-gray-205 dark:border-gray-800/80 hover:shadow-md dark:hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-200 animate-in slide-in-from-top-2 ${getStatusBorder(order.status)}`}>
      {order.scheduledTime && (
        <div className="mb-3 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold py-2 px-3 rounded-xl border border-red-200 dark:border-red-800/50 shadow-sm">
          <Clock className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Scheduled for: {new Date(order.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100/50 dark:bg-orange-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">{order.customer.name}</h4>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Order #{order.id.slice(-6)}</span>
            {order.customer.phone && (
              <a href={`tel:${order.customer.phone}`} className="block mt-1 text-xs text-orange-500 hover:underline font-bold">
                📞 {order.customer.phone}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
            order.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-500/10' :
            order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/10' :
            order.status === 'Preparing' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/10' :
            order.status === 'OutForDelivery' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-500/10' :
            'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400 border border-green-500/10'
          }`}>
            {order.status === 'Pending' ? 'Unverified' : order.status === 'OutForDelivery' ? 'Out' : order.status}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
            order.isCOD 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 border border-blue-500/10'
              : order.paymentReceived
                ? 'bg-green-50/50 dark:bg-green-950/20 text-green-500 dark:text-green-400 border border-green-500/10'
                : 'bg-red-50/50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border border-red-500/10 animate-pulse'
          }`}>
            {order.isCOD ? 'COD' : order.paymentReceived ? 'UPI Paid' : 'UPI Unpaid'}
          </span>
        </div>
      </div>

      <div className="mb-3 p-2.5 bg-gray-50 dark:bg-gray-950/60 rounded-xl text-xs text-gray-650 dark:text-gray-300 border border-gray-100 dark:border-gray-800/40">
        <span className="font-bold text-[9px] text-gray-450 dark:text-gray-500 uppercase tracking-wider">Delivery Location:</span>
        <p className="mt-0.5 font-medium leading-relaxed">{order.deliveryAddress}</p>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
              <span className="font-black text-orange-500 dark:text-orange-400 bg-orange-500/5 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-md text-[10px]">x{item.quantity}</span> {item.foodItem.name}
            </span>
            <span className="text-gray-450 dark:text-gray-500 text-xs">{formatCurrency(item.priceAtTime * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Live tracking map if rider is delivering */}
      {order.status === 'OutForDelivery' && (
        <div className="mb-4 animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800/50 p-2 rounded-2xl bg-gray-50 dark:bg-gray-900/30">
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" /> Live Delivery Map:
          </span>
          {riderCoords[order.id] ? (
            <TrackingMap 
              riderLat={riderCoords[order.id].lat}
              riderLng={riderCoords[order.id].lng}
              canteenName="Your Rider"
            />
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-gray-400">
              Awaiting rider GPS updates...
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/50">
        <div className="text-xs">
          <span className="text-gray-400 dark:text-gray-500">Total: </span>
          <span className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(order.totalAmount)}</span>
        </div>
        
        {order.status === 'Pending' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'Confirmed')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-green-500/20"
          >
            <CheckCircle2 className="w-3 h-3" /> Verify & Confirm
          </button>
        )}

        {order.status === 'Confirmed' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'Preparing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-orange-500/20"
          >
            <Play className="w-3 h-3 fill-current" /> Start Preparing
          </button>
        )}

        {order.status === 'Preparing' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'Ready')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-green-500/20"
          >
            <CheckCircle2 className="w-3 h-3" /> Mark as Ready
          </button>
        )}

        {order.status === 'Ready' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'OutForDelivery')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-indigo-500/20"
          >
            <Play className="w-3 h-3 fill-current" /> Dispatch Delivery
          </button>
        )}

        {order.status === 'OutForDelivery' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'Completed')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors"
          >
            Archive Order
          </button>
        )}
      </div>
    </div>
  );
}

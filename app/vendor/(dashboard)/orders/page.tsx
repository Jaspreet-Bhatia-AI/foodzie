'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  paymentReceived: boolean;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    
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

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => 
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err: any) {
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
    pending: orders.filter(o => o.status === 'Confirmed'),
    preparing: orders.filter(o => o.status === 'Preparing'),
    completed: orders.filter(o => ['Ready', 'Completed'].includes(o.status))
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
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
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
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
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, s: Order['status']) => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow animate-in slide-in-from-top-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">{order.customer.name}</h4>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Order #{order.id.slice(-6)}</span>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
          order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
          order.status === 'Preparing' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
          'bg-green-50 text-green-600 dark:bg-green-900/20'
        }`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <span className="font-bold text-orange-500">x{item.quantity}</span> {item.foodItem.name}
            </span>
            <span className="text-gray-400 text-xs">${(item.priceAtTime * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs">
          <span className="text-gray-400">Total: </span>
          <span className="font-bold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</span>
        </div>
        
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

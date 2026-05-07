'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, getToken } from '@/lib/api';
import { 
  CheckCircle2, 
  Package, 
  ArrowLeft, 
  Loader2, 
  Clock, 
  Store, 
  PartyPopper,
  ShoppingBag
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  foodItem: {
    name: string;
  };
}

interface Order {
  id: string;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  totalAmount: number;
  vendor: {
    vendorName: string;
  };
  items: OrderItem[];
}

const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';

export default function OrdersPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLatestOrder = useCallback(async () => {
    try {
      const orders = await api.get<Order[]>('/api/orders/customer');
      if (orders.length > 0) {
        setOrder(orders[0]); // Show the most recent order
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestOrder();
    audioRef.current = new Audio(SUCCESS_SOUND);
  }, [fetchLatestOrder]);

  useEffect(() => {
    if (!order) return;

    const token = getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    
    const socket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket, subscribing to order:', order.id);
      socket.emit('track:subscribe', { orderId: order.id });
    });

    socket.on('orderStatusUpdate', (data: { orderId: string, status: Order['status'] }) => {
      console.log('Status update received:', data);
      if (data.orderId === order.id) {
        setOrder(prev => prev ? { ...prev, status: data.status } : null);
        
        if (data.status === 'Ready') {
          setShowCelebration(true);
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
          }
          setTimeout(() => setShowCelebration(false), 5000);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.id]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold mb-2">No active orders</h1>
      <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
      <button 
        onClick={() => router.push('/shop')}
        className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20"
      >
        Order Now
      </button>
    </div>
  );

  const steps = [
    { key: 'Confirmed', label: 'Order Placed', icon: Package },
    { key: 'Preparing', label: 'Preparing', icon: Clock },
    { key: 'Ready', label: 'Ready for Pickup', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const activeIndex = currentStepIndex === -1 && order.status === 'Completed' ? 2 : currentStepIndex;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Shop</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full border border-orange-500/20">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Tracking</span>
          </div>
        </div>

        {/* Status Timeline Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 relative overflow-hidden">
          
          {showCelebration && (
            <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <PartyPopper className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
              <h2 className="text-2xl font-black text-green-600 dark:text-green-400">YOUR FOOD IS READY!</h2>
            </div>
          )}

          <div className="mb-10 text-center">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Order Status</h2>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {order.status === 'Confirmed' ? 'Confirmed' : 
               order.status === 'Preparing' ? 'In the Kitchen' :
               order.status === 'Ready' ? 'Ready for Pickup' :
               order.status === 'Completed' ? 'Picked Up' : order.status}
            </div>
          </div>

          <div className="relative flex justify-between">
            {/* Timeline Line */}
            <div className="absolute top-6 left-[10%] w-[80%] h-0.5 bg-gray-100 dark:bg-gray-800 -z-0">
              <div 
                className="h-full bg-orange-500 transition-all duration-1000 ease-in-out" 
                style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= activeIndex;
              const isActive = idx === activeIndex;

              return (
                <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 w-24">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 
                    'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  } ${isActive ? 'scale-125 ring-4 ring-orange-500/20' : ''}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                    isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{order.vendor.vendorName}</h3>
              <p className="text-sm text-gray-500">Order ID: #F-{order.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-orange-500 font-bold">x{item.quantity}</span>
                  <span className="text-gray-700 dark:text-gray-300">{item.foodItem.name}</span>
                </div>
                <span className="text-gray-500">${(item.priceAtTime * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="font-bold text-gray-500">Total Paid</span>
            <span className="text-2xl font-black text-orange-500">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4 items-center">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Keep this page open to receive real-time updates. You will be notified as soon as your food is ready!
          </p>
        </div>
      </div>
    </div>
  );
}

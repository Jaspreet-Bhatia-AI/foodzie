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
  ShoppingBag,
  QrCode,
  Star,
  Download,
  Send,
  X,
  MapPin,
  User,
  Mail,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface FoodItem {
  id: string;
  name: string;
  isVegetarian: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  foodItemId: string;
  foodItem: FoodItem;
}

import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

interface Order {
  id: string;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  };
  vendor: {
    vendorName: string;
  };
  items: OrderItem[];
  rider?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';

export default function OrdersPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Review states
  const [activeReviewItem, setActiveReviewItem] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedItemIds, setReviewedItemIds] = useState<string[]>([]);

  const fetchLatestOrder = useCallback(async () => {
    try {
      const orders = await api.get<Order[]>('/api/orders/customer');
      if (orders.length > 0) {
        let targetId = null;
        if (typeof window !== 'undefined') {
          targetId = new URLSearchParams(window.location.search).get('orderId');
        }
        if (targetId) {
          const found = orders.find(o => o.id === targetId);
          setOrder(found || orders[0]);
        } else {
          setOrder(orders[0]); // Show the most recent order
        }
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
    if (!order?.id) return;
    const orderId = order.id;
    const riderId = order.rider?.id;

    // Fetch initial rider location if assigned
    if (riderId) {
      api.get<{ lat: number; lng: number }>(`/api/delivery/location/${riderId}`)
        .then(coords => {
          setRiderCoords(coords);
        })
        .catch(err => {
          console.warn("Rider location not cached yet:", err.message);
        });
    }

    const token = getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket, subscribing to order:', orderId);
      socket.emit('track:subscribe', { orderId });
    });

    socket.on('orderStatusUpdate', (data: { orderId: string, status: Order['status'] }) => {
      console.log('Status update received:', data);
      if (data.orderId === orderId) {
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

    socket.on('delivery:location', (data: { orderId: string; lat: number; lng: number }) => {
      console.log('Rider live location update:', data);
      if (data.orderId === orderId) {
        setRiderCoords({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.id, order?.rider?.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewItem) return;

    setIsSubmittingReview(true);
    try {
      await api.post('/api/orders/review', {
        foodItemId: activeReviewItem.foodItemId,
        rating,
        comment
      });
      setReviewedItemIds(prev => [...prev, activeReviewItem.foodItemId]);
      setActiveReviewItem(null);
      setRating(5);
      setComment('');
      alert('Thank you! Your review has been submitted.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      alert(message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold mb-2">No active orders</h1>
      <p className="text-gray-500 mb-8">You haven&apos;t placed any orders yet.</p>
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
    { key: 'Ready', label: 'Ready for Delivery', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const activeIndex = currentStepIndex === -1 && order.status === 'Completed' 
    ? 2 
    : (order.status === 'Pending' ? 0 : (currentStepIndex === -1 ? 0 : currentStepIndex));

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  const receiptUrl = `${API_URL}/api/orders/${order.id}/receipt`;
  const verificationLink = `${FRONTEND_URL}/vendor/verify-delivery/${order.id}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-lg shadow-orange-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/shop')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              <span className="font-bold text-sm">Back to Shop</span>
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Order Tracking
                </h1>
                <span className="text-xs font-black px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md uppercase">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-500" /> {order.vendor.vendorName} • Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl border border-orange-500/20 shadow-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">Live Tracking</span>
            </div>
          </div>
        </div>

        {/* Responsive Desktop 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / PRIMARY COLUMN (7 cols on lg, 8 cols on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Status Timeline Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 relative overflow-hidden">
              {showCelebration && (
                <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                  <PartyPopper className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                  <h2 className="text-2xl font-black text-green-600 dark:text-green-400 uppercase tracking-wide">Your Food is Ready!</h2>
                </div>
              )}

              <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-6">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Current Status</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {order.status === 'Confirmed' ? 'Order Confirmed' : 
                     order.status === 'Preparing' ? 'In the Kitchen' :
                     order.status === 'Ready' ? 'Out for Delivery / Ready' :
                     order.status === 'Completed' ? 'Order Delivered' : 
                     order.status === 'Pending' ? 'Waiting for Confirmation' : order.status}
                  </h2>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 self-center sm:self-auto text-center sm:text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Delivery</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-orange-500" /> 15 - 25 mins
                  </span>
                </div>
              </div>

              {/* Timeline Progress Bar */}
              <div className="relative max-w-xl mx-auto px-4 sm:px-8 py-4">
                {/* Timeline Line */}
                <div className="absolute top-10 left-12 right-12 h-1.5 bg-gray-100 dark:bg-gray-800 -z-0 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 ease-in-out rounded-full shadow-md shadow-orange-500/30" 
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between relative z-10">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx <= activeIndex;
                    const isActive = idx === activeIndex;

                    return (
                      <div key={step.key} className="flex flex-col items-center gap-3 w-24">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' : 
                          'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
                        } ${isActive ? 'scale-110 ring-4 ring-orange-500/20' : ''}`}>
                          <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-wider text-center ${
                          isCompleted ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 font-medium'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Location Map */}
            {riderCoords && order.status !== 'Completed' && order.status !== 'Cancelled' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 space-y-5 animate-in zoom-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2.5 uppercase tracking-wider">
                    <span className="w-3 h-3 bg-orange-500 rounded-full animate-ping" /> Live Delivery Tracking Map
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/80 px-3.5 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                    <Store className="w-3.5 h-3.5 text-orange-500" />
                    <span>{order.vendor.vendorName}</span>
                  </div>
                </div>
                
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner">
                  <TrackingMap 
                    riderLat={riderCoords.lat}
                    riderLng={riderCoords.lng}
                    canteenName={order.vendor.vendorName}
                  />
                </div>

                {order.rider && (
                  <div className="flex items-center justify-between p-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/15">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md shadow-orange-500/20">
                        🚴
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{order.rider.name}</p>
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Your Delivery Partner</p>
                      </div>
                    </div>
                    {order.rider.phone && (
                      <a 
                        href={`tel:${order.rider.phone}`}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all"
                      >
                        Call Driver
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Order Items Breakdown & Receipt Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center border border-orange-500/20">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Order Summary</h3>
                    <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'} ordered from {order.vendor.vendorName}</p>
                  </div>
                </div>

                <a 
                  href={receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white border border-orange-500/20 rounded-xl transition-all shadow-sm group"
                >
                  <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" /> 
                  <span>Download PDF Receipt</span>
                </a>
              </div>

              {/* Detailed Items List */}
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm shadow-orange-500/20">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{item.foodItem.name}</span>
                        <span className="text-xs text-gray-400 font-medium">${item.priceAtTime.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${
                        item.foodItem.isVegetarian 
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {item.foodItem.isVegetarian ? 'Veg' : 'Non-Veg'}
                      </span>
                      <span className="text-base font-black text-gray-900 dark:text-white min-w-[60px] text-right">
                        ${(item.priceAtTime * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Amount Paid</span>
                <span className="text-2xl font-black text-orange-500">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Feedback / Review Card (Only shown when order is Completed) */}
            {order.status === 'Completed' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <Star className="w-6 h-6 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Share Your Feedback</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rate the food items to help other students & improve canteen quality</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.items.map(item => {
                    const isReviewed = reviewedItemIds.includes(item.foodItemId);
                    return (
                      <div key={item.id} className="flex flex-col justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">{item.foodItem.name}</span>
                          <p className="text-[11px] text-gray-400">How did this taste?</p>
                        </div>

                        {isReviewed ? (
                          <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20 text-center flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Reviewed ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveReviewItem(item)}
                            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" /> Rate Item
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT / SECONDARY COLUMN (5 cols on lg, 4 cols on xl - Sticky sidebar) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8 lg:sticky lg:top-24">
            
            {/* Verification QR Code (Shown when Confirming/Preparing/Ready) */}
            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
              <div className="bg-gradient-to-b from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-900/90 rounded-3xl p-6 sm:p-8 border-2 border-orange-500/30 dark:border-orange-500/20 shadow-2xl shadow-orange-500/10 flex flex-col items-center text-center space-y-5 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <QrCode className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    Delivery Verification QR
                  </h3>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
                    Show this QR code to the delivery driver upon arrival. Once scanned, your delivery is securely verified.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-3xl border-2 border-orange-100 dark:border-gray-800 shadow-xl shadow-orange-500/5 relative group">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationLink)}`} 
                    alt="Delivery verification QR" 
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain transition-transform group-hover:scale-105 duration-300"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3.5 py-1.5 rounded-full border border-orange-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Contactless Delivery</span>
                </div>
              </div>
            )}

            {/* Delivery & Recipient Details Sidebar Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-orange-500/5 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Delivery Information</h3>
                  <p className="text-xs text-gray-500">Where your food is arriving</p>
                </div>
              </div>

              {/* Delivery Address Box */}
              <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/15 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                  Drop-off Address
                </span>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                  {order.deliveryAddress}
                </p>
              </div>

              {/* Recipient Details */}
              {order.customer && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">
                    Recipient Details
                  </span>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] text-gray-400 font-medium">Customer Name</p>
                        <p className="font-bold text-gray-900 dark:text-white truncate">{order.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] text-gray-400 font-medium">Email Address</p>
                        <p className="font-bold text-gray-900 dark:text-white truncate">{order.customer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Order Stats */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Vendor</span>
                  <span className="font-bold text-gray-900 dark:text-white">{order.vendor.vendorName}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Order Date</span>
                  <span className="font-bold text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Total Amount</span>
                  <span className="font-black text-orange-500 text-sm">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-gray-900 dark:bg-gray-800/80 text-white rounded-3xl p-6 border border-gray-800 shadow-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-black text-sm">Need Help with your order?</h4>
                <p className="text-xs text-gray-400">Contact campus food support or canteen vendor directly.</p>
              </div>
              <button 
                onClick={() => alert("Support: Please contact campus canteen administrator or email support@foodzie.store")}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Help Desk
              </button>
            </div>
            
          </div>
        </div>

      </div>

      {/* Star Rating Dialog */}
      {activeReviewItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <button 
              onClick={() => setActiveReviewItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Item</h3>
              <p className="text-xs text-orange-500 font-bold">{activeReviewItem.foodItem.name}</p>
            </div>

            <form onSubmit={submitReview} className="space-y-6">
              {/* Star rating selector */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star 
                      className="w-8 h-8" 
                      fill={num <= rating ? "currentColor" : "none"} 
                    />
                  </button>
                ))}
              </div>

              {/* Comment field */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Write your feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Delicious! Highly recommended..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm min-h-[100px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

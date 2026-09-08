'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle2, MapPin, Building, Compass, BookOpen, Coins, QrCode, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { api } from '@/lib/api';
import { DietaryIcon } from '@/components/DietaryIcon';
import { useCurrency } from '@/context/CurrencyContext';
import { io } from 'socket.io-client';

interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  squadId?: string | null;
}

export function CartSlideOver({ isOpen, onClose, squadId }: CartSlideOverProps) {
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const cart = useCartStore((state) => state.items);
  const vendorId = useCartStore((state) => state.vendorId);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const [vendorUpi, setVendorUpi] = useState('bhatiajaspreet161@oksbi');
  const [campusCredits, setCampusCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [crossSellItem, setCrossSellItem] = useState<any>(null);

  // Squad Cart State
  const [squadCartItems, setSquadCartItems] = useState<any[]>([]);
  const [squadTotal, setSquadTotal] = useState(0);
  const isSquadMode = !!squadId;

  const fetchSquadCart = async () => {
    if (!squadId) return;
    try {
      const res = await api.get<any>(`/api/squad/${squadId}`);
      setSquadCartItems(res.items || []);
      setSquadTotal(res.totalAmount || 0);
    } catch (err) {
      console.error('Failed to fetch squad cart', err);
    }
  };

  useEffect(() => {
    if (isOpen && isSquadMode) {
      fetchSquadCart();
      const socketUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
      const socket = io(socketUrl);
      socket.on('squadCartUpdated', () => {
        fetchSquadCart();
      });
      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, isSquadMode, squadId]);

  useEffect(() => {
    api.get("/api/auth/me").then(res => {
      const totalC = (res.refundedCredits || 0) + (res.earnedCredits || 0);
      setCampusCredits(totalC);
    }).catch(console.error);
    if (vendorId) {
      api.get<any>(`/api/menu/vendor/${vendorId}`)
        .then(res => {
          if (res.vendorUpi) {
            setVendorUpi(res.vendorUpi);
          }
        })
        .catch(err => console.error("Error fetching vendor UPI", err));
    }
  }, [vendorId]);

  
  useEffect(() => {
    const itemsToCheck = isSquadMode ? squadCartItems : Object.values(cart);
    if (itemsToCheck.length > 0 && vendorId) {
      api.post(`/api/menu/vendor/${vendorId}/cross-sell`, {
        cartItemIds: itemsToCheck.map(i => i.id)
      }).then(res => {
        setCrossSellItem(res.recommendation);
      }).catch(console.error);
    } else {
      setCrossSellItem(null);
    }
  }, [cart, squadCartItems, isSquadMode, vendorId]);
  
  // Address fields
  const [locType, setLocType] = useState<'classroom' | 'park_ground'>('classroom');
  const [uniName, setUniName] = useState('');
  const [blockName, setBlockName] = useState('');
  const [floorNum, setFloorNum] = useState('');
  const [roomNum, setRoomNum] = useState('');
  const [parkName, setParkName] = useState('');
  const [parkDesc, setParkDesc] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('upi');
  const [deliveryTimePref, setDeliveryTimePref] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTimeInput, setScheduledTimeInput] = useState('');

  const cartItems = Object.values(cart);
  const displayItems = isSquadMode ? squadCartItems : cartItems;
  const baseTotal = isSquadMode ? squadTotal : getTotalPrice();
  const discount = useCredits ? Math.min(campusCredits, baseTotal) : 0;
  const total = Math.max(0, baseTotal - discount);

  useEffect(() => {
    if (isOpen && !profileFetched) {
      api.get<any>('/api/auth/me')
        .then(profile => {
          setProfileFetched(true);
          if (profile.university?.name || profile.universityName) {
            setUniName(profile.university?.name || profile.universityName);
          }
        })
        .catch(err => console.error('Failed to pre-fill address:', err));
    }
  }, [isOpen, profileFetched]);
  const handleRemoveItem = async (itemId: string, vId: string) => {
    if (isSquadMode) {
      try {
        await api.post(`/api/squad/${squadId}/add`, {
          foodItemId: itemId,
          quantity: -1
        });
      } catch (err) {
        console.error("Failed to remove from squad", err);
      }
    } else {
      removeItem(itemId);
    }
  };

  const handleAddItem = async (item: any, vId: string) => {
    if (isSquadMode) {
      try {
        await api.post(`/api/squad/${squadId}/add`, {
          foodItemId: item.id,
          quantity: 1
        });
      } catch (err) {
        console.error("Failed to add to squad", err);
      }
    } else {
      addItem(item, vId);
    }
  };


  const handleCheckout = async () => {
    if (displayItems.length === 0 || !vendorId) return;
    setShowAddressModal(true);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let addr = '';
    if (locType === 'classroom') {
      if (!uniName.trim() || !blockName.trim() || !floorNum.trim() || !roomNum.trim()) {
        alert("Please fill in all classroom delivery details.");
        return;
      }
      addr = `Classroom | College: ${uniName.trim()} | Block: ${blockName.trim()} | Floor: ${floorNum.trim()} | Room: ${roomNum.trim()}`;
    } else {
      if (!uniName.trim() || !parkName.trim() || !parkDesc.trim()) {
        alert("Please fill in all park/ground delivery details.");
        return;
      }
      addr = `Park/Ground | College: ${uniName.trim()} | Park/Ground Name: ${parkName.trim()} | Description: ${parkDesc.trim()}`;
    }
    setDeliveryAddress(addr);
    
    if (paymentMethod === 'cod') {
      placeOrder(true, addr);
    } else {
      setShowAddressModal(false);
      setShowUpiModal(true);
    }
  };

  const placeOrder = async (useCOD: boolean, addressToUse: string) => {
    setIsProcessing(true);
    try {
      const itemsPayload = displayItems.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discount ? item.discount.effectivePrice : item.price,
      }));

      let scheduledTimeISO = undefined;
      if (deliveryTimePref === 'scheduled' && scheduledTimeInput) {
        const now = new Date();
        const [hours, minutes] = scheduledTimeInput.split(':').map(Number);
        now.setHours(hours, minutes, 0, 0);
        scheduledTimeISO = now.toISOString();
      }

      const res = await api.post<{ success: boolean; foodzieOrderId: string }>('/api/orders', {
        vendorId,
        items: itemsPayload,
        totalAmount: total,
        deliveryAddress: addressToUse,
        isCOD: useCOD,
        appliedCredits: useCredits ? discount : 0,
        scheduledTime: scheduledTimeISO
      });

      console.log('✅ Order placed successfully!', res);
      setOrderSuccess(true);
      clearCart();
      setShowUpiModal(false);
      setShowAddressModal(false);
      setTimeout(() => {
        setOrderSuccess(false);
        onClose();
        router.push('/shop/orders');
      }, 2000);
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-gray-200 dark:border-gray-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold">Your Cart</h2>
            {isSquadMode && (
              <span className="ml-2 flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-200 dark:border-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live Squad
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {orderSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Order Confirmed!</h3>
              <p className="text-gray-500 dark:text-gray-400">Your order has been placed successfully.</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p className="text-lg">Your cart is empty</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
              >
                Start Browsing
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {displayItems.map((item) => {
                const price = item.discount ? item.discount.effectivePrice : item.price;
                return (
                  <div key={item.id} className="flex gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0 relative">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute bottom-0.5 left-0.5">
                        <DietaryIcon isVegetarian={item.isVegetarian} className="w-3.5 h-3.5 bg-white/90 dark:bg-gray-900/90 border-[1.5px]" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{item.name}</h4>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(price * item.quantity)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center font-semibold text-xs text-gray-900 dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => handleAddItem(item, vendorId!)}
                            disabled={!item.isCooked && item.stock <= item.quantity}
                            className="w-6 h-6 flex items-center justify-center text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span>Total</span>
                  <span className="text-orange-500">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {displayItems.length > 0 && !orderSuccess && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-500/25"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Proceed to Pay • $${total.toFixed(2)}`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Address Details Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowAddressModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" /> Delivery Location
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Specify exactly where the food should be delivered</p>
            </div>

            {/* Selector Toggles */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200/50 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setLocType('classroom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  locType === 'classroom' 
                    ? 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" /> Classroom
              </button>
              <button
                type="button"
                onClick={() => setLocType('park_ground')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  locType === 'park_ground' 
                    ? 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Park / Ground
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              {/* Pre-filled University Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-orange-500" /> University / College Name *
                </label>
                <input
                  type="text"
                  value={uniName}
                  onChange={(e) => setUniName(e.target.value)}
                  placeholder="E.g., Greenfield University"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                  required
                />
              </div>

              {locType === 'classroom' ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Block Name/Number *</label>
                      <input
                        type="text"
                        value={blockName}
                        onChange={(e) => setBlockName(e.target.value)}
                        placeholder="E.g., Block C"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                        required={locType === 'classroom'}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Floor Number *</label>
                      <input
                        type="text"
                        value={floorNum}
                        onChange={(e) => setFloorNum(e.target.value)}
                        placeholder="E.g., 2nd Floor"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                        required={locType === 'classroom'}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Room Name/Number *</label>
                    <input
                      type="text"
                      value={roomNum}
                      onChange={(e) => setRoomNum(e.target.value)}
                      placeholder="E.g., Room 304 or Lab 1"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      required={locType === 'classroom'}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Park or Ground Name *</label>
                    <input
                      type="text"
                      value={parkName}
                      onChange={(e) => setParkName(e.target.value)}
                      placeholder="E.g., Central Lawn or Sports Ground"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      required={locType === 'park_ground'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Lawn Side / Location Description *</label>
                    <textarea
                      value={parkDesc}
                      onChange={(e) => setParkDesc(e.target.value)}
                      placeholder="E.g., East Side under the large banyan tree, near the brick benches"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm min-h-[80px]"
                      required={locType === 'park_ground'}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Time Preference */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Delivery Time *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryTimePref('asap')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      deliveryTimePref === 'asap'
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1 text-orange-500" />
                    <span className="text-xs">ASAP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryTimePref('scheduled')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      deliveryTimePref === 'scheduled'
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1 text-orange-500" />
                    <span className="text-xs">Schedule Later</span>
                  </button>
                </div>
                {deliveryTimePref === 'scheduled' && (
                  <div className="animate-in fade-in duration-300 space-y-1 mt-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Select Time</label>
                    <input
                      type="time"
                      value={scheduledTimeInput}
                      onChange={(e) => setScheduledTimeInput(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                      required={deliveryTimePref === 'scheduled'}
                    />
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1 text-orange-500" />
                    <span className="text-xs">Direct UPI Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Coins className="w-5 h-5 mb-1 text-orange-500" />
                    <span className="text-xs">Cash on Delivery</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                {paymentMethod === 'cod' ? 'Confirm & Place Order' : 'Proceed to UPI Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <button 
              onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pay via GPay / UPI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scan code or pay directly from your app</p>
            </div>

            {/* UPI Details */}
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">Amount to Pay</span>
                <span className="text-3xl font-black text-orange-500">{formatCurrency(total)}</span>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl inline-block border border-gray-100 shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${vendorUpi}&pn=Foodzie&am=${total.toFixed(2)}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-44 h-44"
                />
              </div>

              <div className="text-sm space-y-2">
                <p className="text-gray-500 dark:text-gray-400">Recipient UPI Address:</p>
                <p className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl break-all">
                  {vendorUpi}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <a 
                href={`upi://pay?pa=${vendorUpi}&pn=Foodzie&am=${total.toFixed(2)}&cu=INR`}
                className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20 md:hidden"
              >
                Pay via Mobile App
              </a>

              <button 
                onClick={() => placeOrder(false, deliveryAddress)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/70 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-green-600/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Completing Order...
                  </>
                ) : (
                  "I Have Paid (Complete Order)"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { api } from '@/lib/api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { DietaryIcon } from '@/components/DietaryIcon';

interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
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

  const cartItems = Object.values(cart);
  const total = getTotalPrice();

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !vendorId) return;
    setShowUpiModal(true);
  };

  const confirmUpiOrder = async () => {
    setIsProcessing(true);
    try {
      const itemsPayload = cartItems.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discount ? item.discount.effectivePrice : item.price,
      }));

      // Call backend to create Order directly (using isCOD: true to bypass Razorpay check and place immediately)
      const res = await api.post<{ success: boolean; foodzieOrderId: string }>('/api/orders', {
        vendorId,
        items: itemsPayload,
        totalAmount: total,
        deliveryAddress: "Hostel A, Room 101", // Placeholder
        isCOD: true
      });

      console.log('✅ Order placed via UPI!', res);
      setOrderSuccess(true);
      clearCart();
      setShowUpiModal(false);
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
          ) : cartItems.length === 0 ? (
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
              {cartItems.map((item) => {
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
                        <span className="font-bold text-sm text-gray-900 dark:text-white">${(price * item.quantity).toFixed(2)}</span>
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
                            onClick={() => addItem(item, vendorId!)}
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

        {cartItems.length > 0 && !orderSuccess && (
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
                <span className="text-3xl font-black text-orange-500">₹{total.toFixed(2)}</span>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl inline-block border border-gray-100 shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=bhatiajaspreet161@oksbi&pn=Foodzie&am=${total.toFixed(2)}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-44 h-44"
                />
              </div>

              <div className="text-sm space-y-2">
                <p className="text-gray-500 dark:text-gray-400">Recipient UPI Address:</p>
                <p className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl break-all">
                  bhatiajaspreet161@oksbi
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <a 
                href={`upi://pay?pa=bhatiajaspreet161@oksbi&pn=Foodzie&am=${total.toFixed(2)}&cu=INR`}
                className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20 md:hidden"
              >
                Pay via Mobile App
              </a>

              <button 
                onClick={confirmUpiOrder}
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

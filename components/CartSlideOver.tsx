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

  const cartItems = Object.values(cart);
  const total = getTotalPrice();

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !vendorId) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Load Razorpay script
      const resLoad = await loadRazorpayScript();
      if (!resLoad) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        return;
      }

      // 2. Prepare items for API
      const itemsPayload = cartItems.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discount ? item.discount.effectivePrice : item.price,
      }));

      // 3. Call backend to create Order
      const res = await api.post<{ razorpayOrderId: string; foodzieOrderId: string; amount: number; currency: string; }>('/api/orders', {
        vendorId,
        items: itemsPayload,
        totalAmount: total,
        deliveryAddress: "Hostel A, Room 101", // Placeholder
      });

      // 4. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: res.amount,
        currency: res.currency,
        name: 'Foodzie',
        description: 'Campus Food Delivery',
        order_id: res.razorpayOrderId,
        handler: function (response: any) {
          console.log('✅ Payment successful!', response);
          setOrderSuccess(true);
          clearCart();
          setTimeout(() => {
            setOrderSuccess(false);
            onClose();
            router.push('/shop/orders');
          }, 2000);
        },
        prefill: {
          name: 'Student Name',
          email: 'student@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#f97316'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment Failed', response.error);
        alert('Payment Failed: ' + response.error.description);
      });

      rzp.open();

    } catch (err) {
      console.error('Failed to checkout:', err);
      alert('Failed to process order. Please try again.');
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
    </>
  );
}

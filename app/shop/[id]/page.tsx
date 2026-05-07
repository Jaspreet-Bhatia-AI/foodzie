'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Store, Clock, Plus, Minus, ShoppingBag, Loader2, User, Leaf, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/lib/store/cartStore';
import { CartSlideOver } from '@/components/CartSlideOver';
import { DietaryIcon } from '@/components/DietaryIcon';
import Link from 'next/link';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  prepTimeMins: number;
  isCooked: boolean;
  stock: number;
  isVegetarian: boolean;
  discount: {
    percent: number;
    validFrom: string;
    validTo: string;
    effectivePrice: number;
  } | null;
}

interface Category {
  categoryId: string;
  categoryName: string;
  items: FoodItem[];
}

interface VendorMenu {
  vendorId: string;
  vendorName: string;
  vendorLogoUrl: string | null;
  universityId: string;
  categories: Category[];
}

export default function VendorMenuPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dietary Filter State
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Global cart state
  const cart = useCartStore((state) => state.items);
  const cartVendorId = useCartStore((state) => state.vendorId);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const totalCartPrice = useCartStore((state) => state.getTotalPrice());

  // Slide-over & Modal state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<FoodItem | null>(null);

  useEffect(() => {
    async function fetchVendorMenu() {
      if (!vendorId) return;
      setIsLoading(true);
      try {
        const data = await api.get<VendorMenu>(`/api/menu/vendor/${vendorId}`);
        setVendor(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load canteen menu');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVendorMenu();
  }, [vendorId]);

  const handleAddToCart = (item: FoodItem) => {
    if (cartVendorId && cartVendorId !== vendorId) {
      setPendingItem(item);
      return;
    }
    addItem(item, vendorId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center max-w-md w-full">
          <p className="mb-4">{error || 'Vendor not found'}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/shop')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            {vendor.vendorLogoUrl ? (
              <img src={vendor.vendorLogoUrl} alt={vendor.vendorName} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-300 dark:border-gray-700">
                <Store className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1">{vendor.vendorName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link 
            href="/shop/profile"
            className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            title="Profile"
          >
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Zomato-style Dietary Filter Toggle */}
        <div className="mb-8 flex flex-wrap gap-3 p-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl w-fit">
          <button 
            onClick={() => setDietaryFilter('all')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              dietaryFilter === 'all' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setDietaryFilter('veg')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              dietaryFilter === 'veg' 
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-500/30' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Leaf className="w-4 h-4" /> Veg
          </button>
          <button 
            onClick={() => setDietaryFilter('non-veg')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              dietaryFilter === 'non-veg' 
                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-500/30' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Flame className="w-4 h-4" /> Non-Veg
          </button>
        </div>

        {vendor.categories.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p>This canteen hasn't added any menu items yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {vendor.categories.map((category) => {
              // Apply dietary filter to items
              const filteredItems = category.items.filter(item => {
                if (dietaryFilter === 'veg') return item.isVegetarian;
                if (dietaryFilter === 'non-veg') return !item.isVegetarian;
                return true;
              });

              // Hide category if no items match the filter
              if (filteredItems.length === 0) return null;
              
              return (
                <div key={category.categoryId}>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                    {category.categoryName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => {
                      const cartItem = cart[item.id];
                      const currentPrice = item.discount ? item.discount.effectivePrice : item.price;
                      
                      return (
                        <div 
                          key={item.id} 
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-shadow group"
                        >
                          {/* Image */}
                          <div className="w-24 h-24 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Store className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            {item.discount && (
                              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                -{item.discount.percent}%
                              </div>
                            )}
                            {/* Standard Indian Dietary Mark (Veg/Non-Veg Dot) */}
                            <div className="absolute bottom-1 left-1">
                              <DietaryIcon isVegetarian={item.isVegetarian} className="bg-white/90 dark:bg-gray-900/90 shadow-sm" />
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                {item.isCooked && (
                                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" /> {item.prepTimeMins} min
                                  </span>
                                )}
                                {!item.isCooked && (
                                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                    {item.stock} in stock
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-lg text-gray-900 dark:text-white">${currentPrice.toFixed(2)}</span>
                                {item.discount && (
                                  <span className="text-xs text-gray-400 line-through">${item.price.toFixed(2)}</span>
                                )}
                              </div>
                              
                              {/* Add to Cart Actions */}
                              {cartItem ? (
                                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg p-0.5">
                                  <button 
                                    onClick={() => removeItem(item.id)}
                                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-500 rounded-md shadow-sm hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-4 text-center font-semibold text-sm text-orange-600 dark:text-orange-500">{cartItem.quantity}</span>
                                  <button 
                                    onClick={() => handleAddToCart(item)}
                                    className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-md shadow-sm hover:bg-orange-600 transition-colors"
                                    disabled={!item.isCooked && item.stock <= cartItem.quantity}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleAddToCart(item)}
                                  disabled={!item.isCooked && item.stock <= 0}
                                  className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-orange-500 text-gray-700 dark:text-gray-300 hover:text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
          <div className="bg-orange-500 text-white rounded-2xl p-4 shadow-2xl shadow-orange-500/30 w-full max-w-md flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">{totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}</p>
                <p className="text-white/80 text-xs font-medium">${totalCartPrice.toFixed(2)} total</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-white text-orange-600 hover:bg-gray-50 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart Slide-Over */}
      <CartSlideOver isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Cross-Vendor Confirmation Modal */}
      {pendingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start new order?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Your cart contains items from another canteen. Clear your cart to start a new order from {vendor.vendorName}?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingItem(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  clearCart();
                  addItem(pendingItem, vendorId);
                  setPendingItem(null);
                  setIsCartOpen(true);
                }}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                Clear & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

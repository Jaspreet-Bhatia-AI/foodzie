'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Store, Clock, Plus, Minus, ShoppingBag, Loader2, User, Leaf, Flame, Star, X, Users, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/lib/store/cartStore';
import { CartSlideOver } from '@/components/CartSlideOver';
import { DietaryIcon } from '@/components/DietaryIcon';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';

interface Review {
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string;
}

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
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
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
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  const searchParams = useSearchParams();
  const squadParam = searchParams.get('squad');

  const [creatingSquad, setCreatingSquad] = useState(false);

  const [vendor, setVendor] = useState<VendorMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dietary & Category Filter State
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Reviews view state
  const [selectedReviewItem, setSelectedReviewItem] = useState<FoodItem | null>(null);

  // Global cart state
  const cart = useCartStore((state) => state.items);
  const cartVendorId = useCartStore((state) => state.vendorId);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const totalCartPrice = useCartStore((state) => state.getTotalPrice());

  // Slide-over & Modal state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<FoodItem | null>(null);

  // Job Vacancies & Applications
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [appAge, setAppAge] = useState('');
  const [appCity, setAppCity] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appUpiId, setAppUpiId] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Review submission state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchVendorMenu = async () => {
    if (!vendorId) return;
    setIsLoading(true);
    try {
      const [menuData, vacsData] = await Promise.all([
        api.get<VendorMenu>(`/api/menu/vendor/${vendorId}`),
        api.get<any[]>(`/api/jobs/vacancies?vendorId=${vendorId}`)
      ]);
      setVendor(menuData);
      setVacancies(vacsData || []);

      const addItemId = searchParams?.get('add_item');
      if (addItemId && menuData.categories) {
        let foundItem: FoodItem | null = null;
        for (const cat of menuData.categories) {
          foundItem = cat.items.find((i: FoodItem) => i.id === addItemId) || null;
          if (foundItem) break;
        }
        if (foundItem && foundItem.stock > 0 && foundItem.isCooked) {
          const currentCartVendor = useCartStore.getState().vendorId;
          if (currentCartVendor && currentCartVendor !== vendorId) {
            setPendingItem(foundItem);
          } else {
            useCartStore.getState().addItem(foundItem, vendorId);
          }
          router.replace(`/shop/${vendorId}`);
        }
      }
      
      // Load student profile if logged in
      try {
        const profile = await api.get<any>('/api/auth/me');
        if (profile && profile.role === 'Student') {
          setStudentProfile(profile);
        }
      } catch {
        // not logged in
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load canteen menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorMenu();
  }, [vendorId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewItem) return;
    setSubmittingReview(true);
    try {
      await api.post('/api/reviews', {
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        type: 'FoodItem',
        foodItemId: selectedReviewItem.id,
        canteenId: vendorId
      });
      
      setNewReviewRating(5);
      setNewReviewComment('');
      setSelectedReviewItem(null);
      setNewReviewRating(5);
      setNewReviewComment('');
      
      // Reload menu to show updated reviews list and average rating
      await fetchVendorMenu();
      alert('Review submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async (item: any) => {
    if (cartVendorId && cartVendorId !== vendorId) {
      setPendingItem(item);
      return;
    }
    addItem(item, vendorId);
    
    // Sync with squad API if active
    if (squadParam) {
      try {
        await api.post(`/api/squad/${squadParam}/add`, {
          foodItemId: item.id,
          quantity: 1,
          price: item.discount ? item.discount.effectivePrice : item.price,
          name: item.name
        });
      } catch (err) {
        console.error('Failed to sync to squad cart', err);
      }
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;
    setSubmittingApp(true);
    try {
      await api.post('/api/jobs/apply', {
        vacancyId: selectedVacancy.id,
        age: parseInt(appAge),
        city: appCity.trim(),
        address: appAddress.trim(),
        upiId: appUpiId.trim()
      });
      setShowApplyModal(false);
      setAppAge('');
      setAppCity('');
      setAppAddress('');
      setAppUpiId('');
      alert("Application submitted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
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
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-md truncate">{vendor.vendorName}</h1>
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

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Job hiring banner */}
        {vacancies.length > 0 && studentProfile && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="space-y-1 text-left">
              <span className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                We Are Hiring Riders!
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                Deliver for {vendor.vendorName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                Openings: {vacancies.map(v => v.title).join(', ')} · Salary: {vacancies[0].salary}
              </p>
            </div>
            <button
              onClick={() => { setSelectedVacancy(vacancies[0]); setShowApplyModal(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
            >
              Apply Now
            </button>
          </div>
        )}

        {/* Squad Order Banner / Button */}
        {squadParam ? (
          <div className="mb-8 p-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/30 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Squad Order Active!</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">Invite friends to add to this cart.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const url = window.location.origin + `/shop/${vendorId}?squad=${squadParam}`;
                navigator.clipboard.writeText(url);
                alert('Invite link copied!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Share2 className="w-4 h-4" /> Copy Invite Link
            </button>
          </div>
        ) : (
          <div className="mb-8 flex justify-end">
            <button
              onClick={async () => {
                setCreatingSquad(true);
                try {
                  const res = await api.post<{squadId: string}>('/api/squad/create', { vendorId });
                  router.push(`/shop/${vendorId}?squad=${res.squadId}`);
                } catch (err: any) {
                  alert(err.message || 'Failed to start squad order');
                } finally {
                  setCreatingSquad(false);
                }
              }}
              disabled={creatingSquad}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-70"
            >
              {creatingSquad ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Start a Squad Order
            </button>
          </div>
        )}

        {/* Dietary Filter Toggle */}
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

        {/* Shop Category Navigation */}
        {vendor.categories.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {['All', ...vendor.categories.map((c) => c.categoryName)].map((catName) => (
              <button
                key={catName}
                onClick={() => setActiveCategory(catName)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === catName
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/15'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-orange-500/50 hover:bg-orange-50/50'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        )}

        {vendor.categories.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p>This canteen hasn't added any menu items yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {vendor.categories.map((category) => {
              if (activeCategory !== 'All' && category.categoryName !== activeCategory) {
                return null;
              }

              const filteredItems = category.items.filter(item => {
                if (dietaryFilter === 'veg') return item.isVegetarian;
                if (dietaryFilter === 'non-veg') return !item.isVegetarian;
                return true;
              });

              if (filteredItems.length === 0) return null;
              
              return (
                <div key={category.categoryId}>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                    {category.categoryName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                      const cartItem = cart[item.id];
                      const currentPrice = item.discount ? item.discount.effectivePrice : item.price;
                      
                        return (
                          <div 
                            key={item.id} 
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col hover:shadow-md transition-shadow group"
                          >
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                              {/* Image */}
                              <div className="w-full sm:w-24 h-44 sm:h-24 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
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
                                <div className="absolute bottom-1 left-1">
                                  <DietaryIcon isVegetarian={item.isVegetarian} className="bg-white/90 dark:bg-gray-900/90 shadow-sm" />
                                </div>
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col">
                                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                                      {item.reviewCount && item.reviewCount > 0 ? (
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                          <div className="flex items-center gap-1 text-xs text-amber-550 font-semibold">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span>{item.averageRating?.toFixed(1)}</span>
                                          </div>
                                          <button 
                                            onClick={() => setSelectedReviewItem(item)}
                                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-orange-500 hover:bg-orange-100 dark:hover:bg-orange-600 text-gray-600 dark:text-white hover:text-orange-600 dark:hover:text-white rounded-lg text-xs font-semibold transition-colors"
                                          >
                                            <Star className="w-3 h-3" /> Reviews ({item.reviewCount})
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                          <button 
                                            onClick={() => setSelectedReviewItem(item)}
                                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-orange-500 hover:bg-orange-100 dark:hover:bg-orange-600 text-gray-500 dark:text-white hover:text-orange-600 dark:hover:text-white rounded-lg text-xs font-medium transition-colors"
                                          >
                                            <Star className="w-3 h-3" /> Reviews
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5">{item.description}</p>
                                  )}

                                  {/* VERIFIED REVIEWS */}
                                  {item.reviews && item.reviews.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex items-center text-yellow-400">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 ml-1">
                                          {(item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-400">({item.reviews.length} reviews)</span>
                                      {item.reviews[0].comment && (
                                        <span className="text-[10px] text-gray-500 italic truncate max-w-[120px]">
                                          "{item.reviews[0].comment}"
                                        </span>
                                      )}
                                    </div>
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
                                    <span className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(currentPrice)}</span>
                                    {item.discount && (
                                      <span className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}</span>
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

      {/* Floating Cart Button */}
      {(totalCartItems > 0 || squadParam) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`w-full ${squadParam ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'} text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-between shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150`}
          >
            <div className="flex items-center gap-3">
              {squadParam ? (
                <>
                  <span className="bg-green-700 px-3 py-1 rounded-lg text-xs font-black animate-pulse flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE</span>
                  <span className="text-sm font-black tracking-wide uppercase">View Squad Cart</span>
                </>
              ) : (
                <>
                  <span className="bg-orange-600 px-3 py-1 rounded-lg text-xs font-black">{totalCartItems}</span>
                  <span className="text-sm font-black tracking-wide uppercase">View Your Cart</span>
                </>
              )}
            </div>
            {!squadParam && (
              <span className="text-lg font-black">{formatCurrency(totalCartPrice)}</span>
            )}
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartSlideOver isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} squadId={squadParam} />

      {/* Cart Conflict Modal */}
      {pendingItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 text-center shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Replace Cart Items?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your cart contains items from another canteen. Clear your cart and start a new order at this canteen?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingItem(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  useCartStore.getState().clearCart();
                  addItem(pendingItem, vendorId);
                  setPendingItem(null);
                }}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {selectedReviewItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 text-left shadow-2xl relative max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setSelectedReviewItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Customer Reviews
                </span>
              </h3>
              <p className="text-sm font-semibold text-orange-500">{selectedReviewItem.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {selectedReviewItem.reviews && selectedReviewItem.reviews.length > 0 ? (
                selectedReviewItem.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">{rev.customerName}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-black dark:text-gray-300 leading-relaxed italic">"{rev.comment}"</p>
                    )}
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-black dark:text-gray-400 text-center py-6">No reviews left for this item yet. Be the first to review!</p>
              )}
            </div>

            {studentProfile && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Write a Review</h4>
                <form onSubmit={handleSubmitReview} className="space-y-3 font-bold text-xs text-gray-700 dark:text-gray-300">
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-750'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="e.g. Tastes amazing, perfect spice level!"
                      rows={2}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-black dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 text-[11px] uppercase"
                  >
                    {submittingReview && <Loader2 className="w-3 h-3 animate-spin" />}
                    Submit Review
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Application Modal */}
      {showApplyModal && selectedVacancy && studentProfile && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 text-gray-405 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Apply for Job Opening</h3>
              <p className="text-xs text-gray-500 mt-1">Submit your rider application for <strong>{selectedVacancy.title}</strong> at {vendor.vendorName}.</p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase">Your Name (Autofilled)</span>
                  <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-xs">{studentProfile.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase">Campus (Autofilled)</span>
                  <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-xs truncate">{studentProfile.universityName || 'General Campus'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Your Age *</label>
                  <input
                    type="number"
                    required
                    min={16}
                    max={60}
                    value={appAge}
                    onChange={(e) => setAppAge(e.target.value)}
                    placeholder="e.g. 21"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider block">City *</label>
                  <input
                    type="text"
                    required
                    value={appCity}
                    onChange={(e) => setAppCity(e.target.value)}
                    placeholder="e.g. Jalandhar"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider block">UPI ID (For direct payouts) *</label>
                <input
                  type="text"
                  required
                  value={appUpiId}
                  onChange={(e) => setAppUpiId(e.target.value)}
                  placeholder="e.g. name@okhdfcbank"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Current Hostels / Local Address *</label>
                <textarea
                  required
                  value={appAddress}
                  onChange={(e) => setAppAddress(e.target.value)}
                  placeholder="e.g. Room 304, Hostel 4, LPU Campus"
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {submittingApp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

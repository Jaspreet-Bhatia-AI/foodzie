'use client';

import Link from 'next/link';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Store, ChevronDown, UtensilsCrossed, Loader2, Star, Clock, User, Users, X } from 'lucide-react';
import { api, decodeToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

interface University {
  id: string;
  name: string;
}

interface Vendor {
  vendorId: string;
  vendorName: string;
  vendorLogoUrl: string | null;
  categories: any[];
}

export default function ShopPage() {
  const router = useRouter();

  // JWT payload
  const [userUniName, setUserUniName] = useState<string | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Combobox state
  const [searchUniQuery, setSearchUniQuery] = useState('');
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Review prompt states
  const [pendingReviewOrder, setPendingReviewOrder] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // 1. Get user default university from token
    const token = localStorage.getItem('foodzie_token');
    if (token) {
      const payload = decodeToken<{ universityName?: string; sub?: string }>(token);
      if (payload?.universityName) {
        setUserUniName(payload.universityName);
        setSearchUniQuery(payload.universityName); // Pre-fill search
      }
      
      const studentId = payload?.sub;
      if (studentId) {
        // Load recent orders and reviews in parallel to check for delivered unreviewed orders
        Promise.all([
          api.get<any[]>('/api/orders/customer'),
          api.get<any[]>(`/api/reviews?studentId=${studentId}`)
        ]).then(([ordersData, reviewsData]) => {
          const now = Date.now();
          const unreviewedDelivered = ordersData.find(order => {
            if (order.status !== 'Delivered') return false;
            
            const updatedAtTime = new Date(order.updatedAt || order.createdAt).getTime();
            const timeDiff = now - updatedAtTime;
            
            // Delivered > 15 mins ago and < 2 hours ago
            const isWithinWindow = timeDiff > 15 * 60 * 1000 && timeDiff < 2 * 60 * 60 * 1000;
            if (!isWithinWindow) return false;
            
            // Has not been reviewed yet
            const alreadyReviewed = reviewsData.some(rev => rev.orderId === order.id);
            return !alreadyReviewed;
          });
          
          if (unreviewedDelivered) {
            setPendingReviewOrder(unreviewedDelivered);
          }
        }).catch(err => console.error("Error loading review prompt data:", err));
      }
    }

    // 2. Fetch all universities for the dropdown (with geolocation)
    async function fetchUnis(lat?: number, lng?: number) {
      try {
        let url = '/api/menu/universities';
        if (lat !== undefined && lng !== undefined) {
          url += `?lat=${lat}&lng=${lng}`;
        }
        
        const data = await api.get<{ universities: University[] }>(url);
        setUniversities(data.universities);
        
        // If user has a default university, try to find and select it automatically
        if (token) {
          const payload = decodeToken<{ universityName?: string }>(token);
          if (payload?.universityName) {
            const matchedUni = data.universities.find(u => u.name === payload.universityName);
            if (matchedUni) {
              setSelectedUniId(matchedUni.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load universities', err);
      }
    }

    // Request location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchUnis(pos.coords.latitude, pos.coords.longitude),
        () => fetchUnis() // fallback if denied
      );
    } else {
      fetchUnis();
    }

    // Click outside handler for dropdown
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch vendors whenever the selected university changes
  useEffect(() => {
    if (!selectedUniId) {
      setVendors([]);
      return;
    }

    async function fetchVendors() {
      setIsLoadingVendors(true);
      setError(null);
      try {
        const data = await api.get<{ vendors: Vendor[] }>(`/api/menu/${selectedUniId}`);
        setVendors(data.vendors || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load canteens');
        setVendors([]);
      } finally {
        setIsLoadingVendors(false);
      }
    }

    fetchVendors();
  }, [selectedUniId]);

  const filteredUnis = (searchUniQuery === userUniName || searchUniQuery.trim() === "") ? universities : universities.filter(u => 
    u.name.toLowerCase().includes(searchUniQuery.toLowerCase())
  );

  async function handleSelectUni(uni: University) {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }
    
    setShowDropdown(false);
    if (uni.id === selectedUniId) return;

    alert("Checking your location to confirm you are near " + uni.name + "...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const res = await api.post<{ nearest: University, distanceKm: number, isWithinRadius: boolean }>('/api/universities/nearest', { lat, lng });
          
          if (!res.isWithinRadius || !res.nearest || res.nearest.id !== uni.id) {
            alert("Your location doesn't match the university's location. We are keeping your registered campus: " + (userUniName || 'Unknown'));
            
            // Revert BOTH the text input AND the selected ID so vendors load correctly
            setSearchUniQuery(userUniName || '');
            const originalUni = universities.find(u => u.name === userUniName);
            if (originalUni) {
              setSelectedUniId(originalUni.id);
            }
            return;
          }

          await api.put('/api/auth/me', { universityName: uni.name });
          setSearchUniQuery(uni.name);
          setSelectedUniId(uni.id);
          setUserUniName(uni.name);
          alert("Successfully switched to " + uni.name);
        } catch (err: any) {
          alert("Error verifying location: " + err.message);
          setSearchUniQuery(userUniName || '');
          const originalUni = universities.find(u => u.name === userUniName);
          if (originalUni) setSelectedUniId(originalUni.id);
        }
      },
      (error) => {
        alert("Location permission is required to switch campuses (to prevent accidental orders). Please enable GPS.");
        setSearchUniQuery(userUniName || '');
        const originalUni = universities.find(u => u.name === userUniName);
        if (originalUni) setSelectedUniId(originalUni.id);
      },
      { timeout: 10000 }
    );
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingReviewOrder) return;
    setSubmittingReview(true);
    try {
      await api.post('/api/reviews', {
        type: 'Canteen',
        canteenId: pendingReviewOrder.vendorId,
        orderId: pendingReviewOrder.id,
        rating,
        comment: comment.trim()
      });
      alert("Thank you for your review!");
      setPendingReviewOrder(null);
      setShowReviewModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 flex flex-col">
      
      {/* 15m Post-delivery Review Prompt Banner */}
      {pendingReviewOrder && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 md:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full border border-white/10">Delivered Order Rating Prompt</span>
            <h3 className="text-base font-extrabold mt-1">Enjoyed your recent meal?</h3>
            <p className="text-xs text-white/80 font-normal">We'd love it if you could take 10 seconds to review your order experience.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              Rate Order
            </button>
            <button
              onClick={() => setPendingReviewOrder(null)}
              className="text-white/80 hover:text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 sticky top-0 z-10 flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between shadow-sm">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Foodzie</h1>
          </div>
          
          {/* Mobile Profile & Theme */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <Link 
              href="/shop/profile"
              className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              title="Profile"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          {/* University Selector / Combobox */}
          <div className="relative w-full sm:w-48 md:w-72" ref={dropdownRef}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
              <input
                type="text"
                value={searchUniQuery}
                onChange={(e) => {
                  setSearchUniQuery(e.target.value);
                  setShowDropdown(true);
                  // If they clear or type, disconnect the current selection until they click one
                  if (selectedUniId) setSelectedUniId(null);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search your campus..."
                className="w-full bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-full pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown list */}
            {showDropdown && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-20">
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredUnis.length > 0 ? (
                    filteredUnis.map(uni => (
                      <button
                        key={uni.id}
                        onClick={() => handleSelectUni(uni)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors flex flex-col"
                      >
                        <span className="font-medium">{uni.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No campuses found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Profile & Theme */}
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />
            <Link 
              href="/shop/profile"
              className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              title="Profile"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* Hero Section */}
        <div className="mb-10 text-center md:text-left relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 p-8 md:p-12">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Your Campus Favorites, <span className="text-orange-500">Delivered.</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto md:mx-0">
              {selectedUniId 
                ? `Showing canteens serving ${universities.find(u => u.id === selectedUniId)?.name}. Order ahead and skip the line.`
                : 'Select a campus to see what\'s cooking.'}
            </p>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Vendors Grid */}
        {isLoadingVendors ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
            <p>Finding canteens...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center">
            <p>{error}</p>
          </div>
        ) : selectedUniId && vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-100 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 border-dashed">
            <Store className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-400">No canteens found</p>
            <p className="text-sm mt-1">Looks like no vendors have registered for this campus yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {vendors.map(vendor => (
              <div 
                key={vendor.vendorId} 
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-all group shadow-sm hover:shadow-xl hover:shadow-orange-500/5 relative"
              >
                {/* Brand Color Stripe */}
                <div className="h-2 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
                
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Canteen Logo / Placeholder */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {vendor.vendorLogoUrl ? (
                        <img src={vendor.vendorLogoUrl} alt={vendor.vendorName} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                        {vendor.vendorName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {universities.find(u => u.id === selectedUniId)?.name}
                      </p>
                    </div>
                  </div>

                  {/* Summary / Stats */}
                  <div className="bg-gray-50 dark:bg-gray-950/50 rounded-xl p-3 flex items-center justify-between mb-6 border border-gray-200 dark:border-gray-800/50">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Categories</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">{vendor.categories?.length || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Items</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {vendor.categories?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/shop/${vendor.vendorId}`)}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-500 text-gray-900 dark:text-white hover:text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-orange-500/20"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Engaging Sections to fill up space instead of gray placeholders */}
        {selectedUniId && !isLoadingVendors && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800/60 pt-10 space-y-12">
            
            {/* 1. Trending Bites / Best Items of the Week */}
            {vendors.some(v => v.categories?.some(c => c.items?.length > 0)) && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Trending This Week <span className="text-orange-500">🔥</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vendors
                    .flatMap(v => (v.categories || []).flatMap(c => (c.items || []).map((i: any) => ({ ...i, vendorName: v.vendorName, vendorId: v.vendorId }))))
                    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)) // Sort by rating if available
                    .slice(0, 4)
                    .map((item, idx) => (
                      <div 
                        key={`${item.id}-${idx}`} 
                        onClick={() => router.push(`/shop/${item.vendorId}?add_item=${item.id}`)}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-orange-500/30 transition-all cursor-pointer group"
                      >
                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 overflow-hidden relative">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                          {item.discount && (
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                              SALE
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1 group-hover:text-orange-500 transition-colors">{item.name}</h4>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-gray-500 truncate max-w-[100px]">By {item.vendorName}</span>
                          <span className="font-black text-gray-900 dark:text-white">₹${item.price}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 2. Why Foodzie / Platform Perks */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Why Order With Foodzie?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-orange-50 dark:bg-orange-500/5 rounded-3xl p-6 border border-orange-100 dark:border-orange-500/10">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Zero Wait Times</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order from your dorm, get notified when it's ready, and grab your food hot without standing in line.</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/5 rounded-3xl p-6 border border-amber-100 dark:border-amber-500/10">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Squad Orders</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Invite your friends to a shared cart. Everyone adds what they want, checkout once.</p>
                </div>
                <div className="bg-green-50 dark:bg-green-500/5 rounded-3xl p-6 border border-green-100 dark:border-green-500/10">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Verified Reviews</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Read honest reviews from other students. Only confirmed orders can leave ratings.</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Review Modal */}
      {showReviewModal && pendingReviewOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rate Your Experience</h3>
              <p className="text-xs text-gray-500 mt-1">Please leave a star rating and comment on your order.</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
              <div className="space-y-2 text-center py-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Choose Star Rating</span>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Add Comment / Review (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Delicious hot food, arrived on time!"
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-semibold resize-none"
                />
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

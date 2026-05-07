'use client';

import Link from 'next/link';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Store, ChevronDown, UtensilsCrossed, Loader2, Star, Clock, User } from 'lucide-react';
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
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Breakfast', 'Snacks', 'Meals', 'Drinks', 'Desserts'];

  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Get user default university from token
    const token = localStorage.getItem('foodzie_token');
    if (token) {
      const payload = decodeToken<{ universityName?: string }>(token);
      if (payload?.universityName) {
        setUserUniName(payload.universityName);
        setSearchUniQuery(payload.universityName); // Pre-fill search
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

  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(searchUniQuery.toLowerCase())
  );

  function handleSelectUni(uni: University) {
    setSearchUniQuery(uni.name);
    setSelectedUniId(uni.id);
    setShowDropdown(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 flex flex-col">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Foodzie</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* University Selector / Combobox */}
          <div className="relative w-48 md:w-72" ref={dropdownRef}>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        
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

        {/* Category Scrollbar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/10'
              }`}
            >
              {cat}
            </button>
          ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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

        {/* Popular Near You (Placeholders) */}
        {selectedUniId && vendors.length <= 3 && !isLoadingVendors && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800/60 pt-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Popular Near You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm opacity-60 grayscale hover:grayscale-0 transition-all duration-300 cursor-not-allowed">
                  <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4 flex items-center justify-center">
                    <UtensilsCrossed className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Coming Soon {i}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-gray-400" />
                    <span>New vendor joining</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

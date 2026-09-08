'use client';

import React, { useState } from 'react';
import { 
  Leaf, Zap, Tag, MapPin, Navigation, CloudRain, ShieldCheck, 
  ScanLine, ArrowRight, Star, ShoppingBag, Clock, CheckCircle2,
  TrendingUp, Award, Droplets, Sun, ChevronRight, Menu, X, Check,
  Store, Plus, Users
} from 'lucide-react';

// ─── 1. STUDENT PORTAL (/shop) OVERHAUL ──────────────────────────────────────────
const StudentView = () => {
  return (
    <div className="relative min-h-[800px] bg-[#F8FAFC] dark:bg-[#020617] pb-24 font-sans selection:bg-orange-500/30 overflow-hidden">
      {/* Organic Header */}
      <div className="relative bg-gradient-to-br from-orange-500 to-red-600 pt-12 pb-16 px-6 rounded-br-[5rem] shadow-[0_20px_50px_-12px_rgba(234,88,12,0.4)] z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex justify-between items-center mb-6 text-white">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>
                SBBSU <span className="text-orange-200">Eats</span>
              </h1>
              <p className="text-orange-100 text-sm font-medium mt-1">What are you craving today?</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center -rotate-3 hover:rotate-0 transition-all cursor-pointer shadow-lg border border-white/20">
              <ShoppingBag className="text-white" />
            </div>
          </div>
          
          {/* Gamified Loyalty Progress */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-yellow-300" />
                <span className="font-bold">Level 3 Foodie</span>
              </div>
              <span className="text-sm font-medium">450 / 500 Credits</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 w-[90%] rounded-full relative">
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-sm animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-orange-100 mt-2">50 more credits to unlock a free Iced Latte!</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-6 relative z-20">
        {/* Dietary Quick-Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {[
            { icon: Leaf, label: 'Strictly Veg', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
            { icon: Zap, label: 'High Protein', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { icon: Tag, label: 'Discounts', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
          ].map((filter, i) => (
            <button key={i} className={`flex-shrink-0 snap-center flex items-center gap-2 px-4 py-3 rounded-2xl ${filter.bg} shadow-sm border border-black/5 dark:border-white/5 hover:scale-105 active:scale-95 transition-all`}>
              <filter.icon size={18} className={filter.color} />
              <span className={`text-sm font-semibold text-slate-800 dark:text-slate-200`}>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Discovery Feed */}
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>Trending Today</h2>
            <TrendingUp className="text-orange-500 animate-bounce" size={20} />
          </div>
          
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="group relative bg-white dark:bg-slate-900 rounded-[2rem] rounded-tr-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg rotate-3 z-10">
                  Popular 🔥
                </div>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-orange-100 dark:bg-slate-800 rounded-2xl overflow-hidden group-hover:rotate-2 transition-transform duration-300 flex items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${i}&backgroundColor=transparent`} alt="food" className="w-16 h-16 opacity-50 mix-blend-multiply dark:mix-blend-screen" />
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Spicy Paneer Wrap</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><Store size={14}/> Canteen A</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-black text-lg text-orange-600 dark:text-orange-500">₹120</span>
                      <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-colors">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Cart (Mobile) */}
      <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-lg">2</div>
          <div>
            <p className="text-sm font-medium text-slate-300">Total Order</p>
            <p className="font-bold text-lg">₹240.00</p>
          </div>
        </div>
        <button className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:pr-4">
          Checkout <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── 2. VENDOR DASHBOARD (/vendor) OVERHAUL ──────────────────────────────────────
const VendorView = () => {
  return (
    <div className="min-h-[800px] bg-[#F8FAFC] dark:bg-[#020617] p-6 lg:p-10 font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>Live Kitchen</h1>
          <p className="text-slate-500 font-medium mt-2">Manage incoming orders efficiently.</p>
        </div>
        {/* Prominent QR Scanner CTA for Tablets/Desktop */}
        <button className="hidden md:flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:scale-105 hover:-rotate-1 transition-all shadow-xl">
          <ScanLine size={20} /> Scan Pickup QR
        </button>
      </div>

      {/* High-Density Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['New Orders (4)', 'Preparing (2)', 'Ready / Out (1)'].map((col, i) => (
          <div key={i} className="bg-slate-100/50 dark:bg-slate-800/30 rounded-[2rem] p-4 border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 px-2 font-poppins">{col}</h3>
            <div className="space-y-3">
              {[1, 2].map((card) => (
                <div key={card} className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border-l-4 border-l-orange-500 hover:translate-x-1 transition-transform cursor-pointer relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-bold">#ORD-99{i}{card}</span>
                      <span className="text-xs text-orange-600 font-bold flex items-center gap-1"><Clock size={12}/> 2m ago</span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">2x Spicy Burger</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">1x Cold Coffee</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating QR FAB for Mobile */}
      <button className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(234,88,12,0.8)] z-50 hover:scale-110 active:scale-95 transition-all">
        <ScanLine size={24} />
      </button>
    </div>
  );
};

// ─── 3. RIDER DELIVERY PORTAL (/rider) OVERHAUL ──────────────────────────────────
const RiderView = () => {
  return (
    <div className="relative min-h-[800px] bg-slate-900 font-sans overflow-hidden">
      {/* Simulated Leaflet Map Background */}
      <div className="absolute inset-0 bg-[#1e293b] opacity-50" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 h-full flex flex-col p-6">
        
        {/* Weather/Traffic Overlay Pill */}
        <div className="self-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
          <CloudRain className="text-blue-500" size={18} />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Light Rain expected in 10 mins. Drive safe!</span>
        </div>

        <div className="mt-auto space-y-4">
          {/* Active Delivery Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-orange-600 dark:text-orange-500 font-bold text-sm mb-1 uppercase tracking-wider">Current Order</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Hostel Block B</h2>
                <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin size={14}/> Room 402, 4th Floor</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold px-3 py-1 rounded-xl">
                ₹150 COD
              </div>
            </div>

            {/* Swipe to Confirm Simulated Interaction */}
            <div className="relative bg-slate-100 dark:bg-slate-800 h-16 rounded-full flex items-center p-1 cursor-pointer overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500 w-0 group-hover:w-full transition-all duration-700 ease-out z-0"></div>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors duration-300">Swipe to complete delivery</span>
              </div>
              <div className="relative z-20 w-14 h-14 bg-white shadow-md rounded-full flex items-center justify-center text-slate-800 group-hover:translate-x-[calc(100vw-8rem)] sm:group-hover:translate-x-[20rem] transition-transform duration-700 ease-out">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 4. SUPER ADMIN (/admin) OVERHAUL ────────────────────────────────────────────
const AdminView = () => {
  return (
    <div className="min-h-[800px] bg-[#F8FAFC] dark:bg-[#020617] p-6 lg:p-10 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>Platform Overview</h1>
      </div>

      {/* Irregular Asymmetric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 h-[600px]">
        
        {/* Large Widget (Row span 2, Col span 2) */}
        <div className="md:col-span-2 md:row-span-2 bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-600 rounded-full blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <h3 className="font-poppins font-semibold text-slate-400 mb-2">Total System Revenue</h3>
            <p className="text-5xl font-black mb-8 font-inter">₹1,245,000</p>
            {/* Simulated Chart */}
            <div className="h-32 flex items-end gap-3 opacity-80">
              {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-white/20 rounded-t-md hover:bg-orange-500 transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Medium Widget */}
        <div className="md:col-span-2 md:row-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-poppins font-semibold text-slate-500 dark:text-slate-400">Active Riders</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">42 / 50</p>
          </div>
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center -rotate-6">
            <Navigation size={28} fill="currentColor" />
          </div>
        </div>

        {/* Small Widget 1 */}
        <div className="md:col-span-1 md:row-span-1 bg-orange-500 text-white rounded-[2rem] p-6 shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col justify-between">
          <ShieldCheck size={24} className="opacity-80" />
          <div>
            <p className="text-4xl font-black">99.9%</p>
            <p className="text-sm font-medium opacity-90 mt-1">System Uptime</p>
          </div>
        </div>

        {/* Small Widget 2 */}
        <div className="md:col-span-1 md:row-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Users size={18} />
            </div>
            <span className="text-emerald-500 font-bold text-sm">+12%</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">New Students</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">843</p>
        </div>

        {/* Wide Widget */}
        <div className="md:col-span-4 md:row-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Health Check</h3>
              <p className="text-slate-500 text-sm">PostgreSQL, Redis, and WebSockets are operating normally.</p>
            </div>
          </div>
          <button className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            View Logs
          </button>
        </div>
        
      </div>
    </div>
  );
};

// ─── SHOWCASE SHELL ──────────────────────────────────────────────────────────────
export default function UIOverhaulShowcase() {
  const [activeTab, setActiveTab] = useState('Student');
  const tabs = ['Student', 'Vendor', 'Rider', 'Admin'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Dev Navigation */}
      <div className="sticky top-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 text-white p-1.5 rounded-lg"><Store size={18} /></div>
            <span className="font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>Foodzie UI Overhaul</span>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render Active View */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'Student' && <StudentView />}
        {activeTab === 'Vendor' && <VendorView />}
        {activeTab === 'Rider' && <RiderView />}
        {activeTab === 'Admin' && <AdminView />}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Zap, ShieldCheck, Star, ArrowRight, Flame, Package, Clock, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBrand } from '@/context/BrandContext';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { brandName } = useBrand();

  return (
    <div className="min-h-screen bg-gray-100/50 dark:bg-gray-900/40 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300 relative">

      {/* Branded Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/foodzie_bg_pattern.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0" />

      {/* ── Ambient background glows ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-orange-600/10 dark:bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-amber-600/5 dark:bg-amber-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-30 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{brandName}</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Contact
          </Link>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-gray-650 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-950/60"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md z-20 md:hidden flex flex-col items-center justify-center gap-8 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Link 
          href="/about" 
          onClick={() => setMobileMenuOpen(false)}
          className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          About Us
        </Link>
        <Link 
          href="/contact" 
          onClick={() => setMobileMenuOpen(false)}
          className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Contact
        </Link>
        <Link 
          href="/login" 
          onClick={() => setMobileMenuOpen(false)}
          className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Sign in
        </Link>
        <Link 
          href="/signup" 
          onClick={() => setMobileMenuOpen(false)}
          className="text-xl font-bold bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-2xl shadow-lg shadow-orange-500/25 transition-all"
        >
          Get Started
        </Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto">
          {/* Center: Text & CTA */}
          <div className="text-center space-y-6 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              Campus Food Delivery — Reimagined
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
              Hot food,{' '}
              <span className="text-orange-500 dark:text-orange-400">
                right on campus.
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
              Order from your university canteen in seconds. Vendors manage menus effortlessly. Everyone eats better.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                id="hero-get-started-btn"
                href="/signup"
                className="group flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-semibold transition-colors underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 hover:decoration-gray-500"
              >
                Already have an account? Sign in
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-1.5 pt-4 text-xs font-bold text-gray-500 dark:text-gray-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ))}
              <span className="ml-2 text-gray-500">Loved by 500+ students across 12 universities</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-out">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Card 1 */}
          <div className="group bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 hover:border-orange-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-orange-500/5">
            <div className="w-11 h-11 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Cooked to Order</h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed font-medium">
              Fresh samosas, biryani, and more — made when you order. No cold food, ever.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-200 dark:border-gray-800 hover:border-orange-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-orange-500/5">
            <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Packaged Items</h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed font-medium">
              Grab chips, drinks, and snacks with real-time stock tracking. Know before you go.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-200 dark:border-gray-800 hover:border-orange-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-orange-500/5">
            <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Live Order Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed font-medium">
              Watch your order go from pending → preparing → delivered with live tracking, so you always know exactly where your food is.
            </p>
          </div>
        </div>
      </section>

      {/* ── Menu Collage Card Banner Section ────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out">
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-12">
          {/* Collage Preview */}
          <div className="w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner shrink-0">
            <img 
              src="/campus_food_menu.jpg" 
              alt="Campus Canteen menu favorites" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Section Info */}
          <div className="space-y-4 text-left">
            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:text-orange-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Explore Canteens
            </span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
              Enjoy freshly prepared canteen favorites on demand.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm leading-relaxed font-medium">
              From hot cheese burgers and spicy samosas to authentic paneer meals and fresh fruit smoothies, {brandName} connects you directly with all the kitchens on your campus. Zero markup, zero hidden commissions.
            </p>
            <div className="pt-2">
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-sm hover:underline"
              >
                Browse canteen menus near you <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Role split section ────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-28 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 ease-out">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Student CTA */}
          <div className="relative bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-orange-900/30 dark:from-orange-600/25 dark:via-amber-500/15 dark:to-orange-950/50 border border-orange-400/30 dark:border-orange-500/30 rounded-3xl p-8 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-52 h-52 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
            <span className="inline-block bg-orange-500/20 border border-orange-400/30 text-orange-500 dark:text-orange-300 text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Student
            </span>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Hungry? Let&apos;s eat.</h3>
            <p className="text-orange-900/70 dark:text-orange-200/70 text-sm mb-6 font-medium">
              Browse your canteen menu, order in one tap, and get it delivered to your hostel.
            </p>
            <Link
              id="student-signup-btn"
              href="/signup?role=Student"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95"
            >
              Order Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Vendor CTA */}
          <div className="relative bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-indigo-900/30 dark:from-blue-600/25 dark:via-violet-500/15 dark:to-indigo-950/50 border border-blue-400/30 dark:border-blue-500/30 rounded-3xl p-8 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-52 h-52 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
            <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-600 dark:text-blue-300 text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Canteen Vendor
            </span>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Grow your canteen.</h3>
            <p className="text-blue-900/70 dark:text-blue-200/70 text-sm mb-6 font-medium">
              Manage your menu, track inventory, and process orders — all from one dashboard.
            </p>
            <Link
              id="vendor-signup-btn"
              href="/signup?role=Vendor"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
            >
              Open Your Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews Marquee ────────────────────────────────────────── */}
      <section className="relative z-10 py-16 overflow-hidden border-t border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-950/35">
        <div className="max-w-6xl mx-auto px-6 mb-8 text-center">
          <span className="text-xs font-black tracking-widest text-orange-500 uppercase">Wall of Love</span>
          <h2 className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">What Students Say About {brandName}</h2>
        </div>

        {/* Row 1: Right to Left */}
        <div className="w-full flex overflow-hidden select-none gap-6 relative">
          <div className="animate-marquee flex gap-6 py-4 whitespace-nowrap">
            {[
              { name: 'Aarav Mehta', rating: 5, comment: 'Foodzie completely transformed how we get food at LPU campus. Incredible speed!' },
              { name: 'Harpreet Kaur', rating: 5, comment: 'Direct payment to vendors and no middleman means food is highly affordable. Love the model!' },
              { name: 'Ishaan Gupta', rating: 4, comment: 'Best app for hostels. Getting food delivered right to our hostel gates is a blessing.' },
              { name: 'Simranjeet Singh', rating: 5, comment: 'I got hired as a delivery rider through this app. Super fast application and payout direct to my UPI.' },
              { name: 'Jaspreet Bhatia', rating: 5, comment: 'A transparent and direct marketplace. Canteen vendors can scale without external commissions.' },
              { name: 'Riya Sen', rating: 4, comment: 'The UI is extremely beautiful, especially in dark mode. Placing orders is super fast.' },
              { name: 'Vikram Sharma', rating: 5, comment: 'No delivery delays! The automated dispatch allocates to canteens riders efficiently.' },
              { name: 'Ananya Joshi', rating: 5, comment: 'Extremely direct and fast. Love the GPay QR integration during checkout.' },
              { name: 'Divya Chawla', rating: 4, comment: 'Highly recommended! The campus food issue is solved once and for all.' },
              { name: 'Gurpreet Singh', rating: 5, comment: 'Amazing platform. Seamless student reviews help select the best dishes in canteen.' }
            ].concat([
              { name: 'Aarav Mehta', rating: 5, comment: 'Foodzie completely transformed how we get food at LPU campus. Incredible speed!' },
              { name: 'Harpreet Kaur', rating: 5, comment: 'Direct payment to vendors and no middleman means food is highly affordable. Love the model!' },
              { name: 'Ishaan Gupta', rating: 4, comment: 'Best app for hostels. Getting food delivered right to our hostel gates is a blessing.' },
              { name: 'Simranjeet Singh', rating: 5, comment: 'I got hired as a delivery rider through this app. Super fast application and payout direct to my UPI.' },
              { name: 'Jaspreet Bhatia', rating: 5, comment: 'A transparent and direct marketplace. Canteen vendors can scale without external commissions.' },
              { name: 'Riya Sen', rating: 4, comment: 'The UI is extremely beautiful, especially in dark mode. Placing orders is super fast.' },
              { name: 'Vikram Sharma', rating: 5, comment: 'No delivery delays! The automated dispatch allocates to canteens riders efficiently.' },
              { name: 'Ananya Joshi', rating: 5, comment: 'Extremely direct and fast. Love the GPay QR integration during checkout.' },
              { name: 'Divya Chawla', rating: 4, comment: 'Highly recommended! The campus food issue is solved once and for all.' },
              { name: 'Gurpreet Singh', rating: 5, comment: 'Amazing platform. Seamless student reviews help select the best dishes in canteen.' }
            ]).map((rev, idx) => (
              <div key={idx} className="bg-gray-100/50 dark:bg-gray-900/40 dark:bg-gray-900 border border-gray-200 dark:border-gray-200 dark:border-gray-800 rounded-3xl p-5 w-[320px] shrink-0 shadow-sm">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400 text-sm">
                    {rev.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{rev.name}</h4>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 fill-amber-500 ${i < rev.rating ? 'text-amber-500' : 'text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed whitespace-normal font-medium">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Section ────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 dark:text-white">{brandName}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              The direct-to-vendor dining portal built for college campuses. Order, track, and support local canteen merchants directly.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/10">
                ● Live 12 Campuses
              </span>
              <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/10">
                ★ 4.9 Rating
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-left space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Navigation</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Home Landing</Link></li>
              <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">About Story</Link></li>
              <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Contact Support</Link></li>
              <li><Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Portal Login</Link></li>
              <li><Link href="/signup" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Merchant Signup</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal Policy */}
          <div className="text-left space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Legal & Terms</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Refund & Cancellations</Link></li>
              <li><Link href="/rider-code" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Rider Code of Conduct</Link></li>
            </ul>
          </div>

          {/* Column 4: Support Contact */}
          <div className="text-left space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Support Hub</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <li>Email: <a href="mailto:bhatiajaspreet161@gmail.com" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-bold">bhatiajaspreet161@gmail.com</a></li>
              <li>Phone: <span className="text-gray-900 dark:text-white font-bold">+91 7717670668</span></li>
              <li>Address: <span className="font-medium">93, Mehmadpur, Jalandhar, 144102, Punjab, India</span></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom copyright & info */}
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400">
          <p className="font-semibold">
            © {new Date().getFullYear()} {brandName}. Built with ❤️ for college campus dining.
          </p>
          <p className="font-semibold">
            Designed and built by Jaspreet Bhatia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

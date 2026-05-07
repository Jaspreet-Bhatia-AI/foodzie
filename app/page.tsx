'use client';

import Link from 'next/link';
import { UtensilsCrossed, Zap, ShieldCheck, Star, ArrowRight, Flame, Package, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── Ambient background glows ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-amber-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Foodzie</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
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
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 tracking-wide">
          <Zap className="w-3.5 h-3.5" />
          Campus Food Delivery — Reimagined
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter mb-6">
          Hot food,{' '}
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            right on campus.
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
          Order from your university canteen in seconds. Vendors manage menus effortlessly.
          Everyone eats better.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            id="hero-get-started-btn"
            href="/signup"
            className="group flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4 decoration-gray-700 hover:decoration-gray-400"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-1.5 mt-10 text-xs text-gray-600">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          ))}
          <span className="ml-2 text-gray-500">Loved by 500+ students across 12 universities</span>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* Card 1 */}
          <div className="group bg-gray-900/70 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Cooked to Order</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fresh samosas, biryani, and more — made when you order. No cold food, ever.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-gray-900/70 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Packaged Items</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Grab chips, drinks, and snacks with real-time stock tracking. Know before you go.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-gray-900/70 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Live Order Tracking</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Watch your order go from pending → preparing → delivered in real-time via WebSockets.
            </p>
          </div>
        </div>
      </section>

      {/* ── Role split section ────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-28 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Student CTA */}
          <div className="relative bg-gradient-to-br from-orange-600/10 to-orange-900/20 border border-orange-500/20 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <span className="inline-block bg-orange-500/15 text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
              STUDENT
            </span>
            <h3 className="text-2xl font-bold text-white mb-3">Hungry? Let&apos;s eat.</h3>
            <p className="text-gray-400 text-sm mb-6">
              Browse your canteen menu, order in one tap, and get it delivered to your hostel.
            </p>
            <Link
              id="student-signup-btn"
              href="/signup?role=Student"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              Order Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Vendor CTA */}
          <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gray-700/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <span className="inline-block bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
              CANTEEN VENDOR
            </span>
            <h3 className="text-2xl font-bold text-white mb-3">Grow your canteen.</h3>
            <p className="text-gray-400 text-sm mb-6">
              Manage your menu, track inventory, and process orders — all from one dashboard.
            </p>
            <Link
              id="vendor-signup-btn"
              href="/signup?role=Vendor"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              Open Your Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-gray-800/60 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
          {[
            { icon: ShieldCheck, label: 'Secure Payments', sub: 'End-to-end encrypted' },
            { icon: Zap, label: 'Lightning Fast', sub: 'Orders in under 60 seconds' },
            { icon: Star, label: '4.9 / 5 Rating', sub: 'From real student reviews' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-800/60 py-6 px-6 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Foodzie. Built with ❤️ for campus life.
        </p>
      </footer>
    </div>
  );
}

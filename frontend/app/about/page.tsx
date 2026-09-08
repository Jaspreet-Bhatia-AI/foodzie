'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft, ArrowRight, Heart, ShieldCheck, Zap, Users, GraduationCap, Store, ShieldAlert } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AboutPage() {
  const { brandName } = useBrand();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden font-sans transition-colors duration-300 relative">
      
      {/* Branded Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/foodzie_bg_pattern.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0" />
      
      {/* ── Ambient background glows ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">{brandName}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-16">
        
        {/* Hero Headline */}
        <div className="text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Our Story & Mission
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
            Reimagining College Campus Dining
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed font-medium">
            Foodzie is the leading direct-to-vendor campus logistics and dining portal designed to bridge the gap between hungry students, local canteens, and flexible student gig opportunities.
          </p>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          {[
            { metric: '12+', label: 'Active Universities', icon: GraduationCap, color: 'text-orange-600 dark:text-orange-400' },
            { metric: '14+', label: 'Registered Canteens', icon: Store, color: 'text-blue-600 dark:text-blue-400' },
            { metric: '5,000+', label: 'Happy Students Served', icon: Users, color: 'text-green-600 dark:text-green-400' },
            { metric: '99.2%', label: 'Delivery Success SLA', icon: Zap, color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ metric, label, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800/80 rounded-xl flex items-center justify-center mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{metric}</p>
              <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </section>

        {/* Core Sections split */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {/* Mission Card */}
          <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 space-y-4 shadow-sm hover:border-orange-500/10 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-orange-500" />
              Our Core Vision
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-semibold">
              We empower local university canteen owners by giving them access to industry-level order processing and automated dispatch technology. By eliminating expensive aggregate platforms, we guarantee zero commission markups, directly lowering food prices for students.
            </p>
          </div>

          {/* Model Card */}
          <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 space-y-4 shadow-sm hover:border-orange-500/10 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Direct Payments Architecture
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-semibold">
              We believe in financial transparency. Foodzie supports immediate payment settlement: students pay directly to the canteen's private UPI address at checkout. We act as a software broker, ensuring instant merchant liquidity without holding payments.
            </p>
          </div>
        </section>

        {/* Operational Values Section */}
        <section className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="max-w-3xl space-y-6 text-left">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Student Gig Network
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Flexible delivery jobs built around student schedules.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm leading-relaxed font-medium">
              We provide campuses with a self-sufficient student rider economy. Canteen vendors post delivery vacancies directly within their panels, and student applicants can join the local delivery fleet. Earnings are transferred directly to the rider's personal UPI account daily, facilitating pocket money opportunities with complete operational flexibility.
            </p>
            <div className="pt-2">
              <Link href="/contact" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-sm hover:underline">
                Have questions about our campus deployment model? Get in touch <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-xs text-gray-500 font-semibold relative z-10">
        © {new Date().getFullYear()} {brandName}. Designed and built by Jaspreet Bhatia. All rights reserved.
      </footer>
    </div>
  );
}

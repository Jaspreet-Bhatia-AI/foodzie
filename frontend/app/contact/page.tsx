'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft, Mail, MapPin, Lightbulb } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ContactPage() {
  const { brandName } = useBrand();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden font-sans transition-colors duration-300 relative">
      <div className="absolute inset-0 bg-[url('/foodzie_bg_pattern.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0" />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold">
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

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-4">Contact & Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-12 text-lg">
          Have an issue with an order or want to bring your campus canteen to Foodzie? Reach out to us below.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {/* Email Support */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-orange-600 dark:text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              We aim to respond to all inquiries within 24-48 hours.
            </p>
            <a href="mailto:bhatiajaspreet161@gmail.com" className="text-orange-600 dark:text-orange-500 font-bold hover:underline">
              bhatiajaspreet161@gmail.com
            </a>
          </div>

          {/* Operating Address */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Operating Address</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Foodzie<br />
              93, Mehmadpur, Adampur<br />
              Jalandhar, 144102<br />
              Punjab, India
            </p>
          </div>
        </div>

        {/* Future Recommendations */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-bold">Planned Email Domains</h3>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            We are in the process of setting up official domain emails. In the future, you will be able to reach us at:
          </p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <strong className="text-white">support@foodzie.store</strong> — For general student and order issues.
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <strong className="text-white">vendors@foodzie.store</strong> — For new canteens applying to join the platform.
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <strong className="text-white">legal@foodzie.store</strong> — For privacy, terms, and compliance requests.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

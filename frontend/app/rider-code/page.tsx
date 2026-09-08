'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RiderCodePage() {
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
        <h1 className="text-4xl font-black mb-8">Rider Code of Conduct</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <p className="font-medium text-lg">Last Updated: July 2026</p>
          
          <h2 className="text-2xl font-bold mt-8">1. Professionalism</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Student riders represent the {brandName} community. You must remain polite and professional with both canteens and fellow students during pickups and deliveries.
          </p>

          <h2 className="text-2xl font-bold mt-8">2. Timeliness & Food Safety</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ensure food is delivered promptly to maintain temperature and quality. Do not tamper with sealed packages. Hand the food directly to the student or leave it at the designated drop-off point if requested.
          </p>

          <h2 className="text-2xl font-bold mt-8">3. Cash on Delivery (COD) Handling</h2>
          <p className="text-gray-600 dark:text-gray-400">
            For COD orders, you are responsible for collecting the exact amount and depositing it accurately into the canteen's ledger via your rider dashboard. Failure to remit collected cash will result in immediate suspension and disciplinary action from the university.
          </p>

          <h2 className="text-2xl font-bold mt-8">4. Zero Tolerance</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Any reports of harassment, theft, or unsafe driving/biking on campus grounds will lead to immediate deactivation from the {brandName} platform and possible campus administrative action.
          </p>
        </div>
      </main>
    </div>
  );
}

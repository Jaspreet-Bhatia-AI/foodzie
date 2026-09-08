'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RefundsPage() {
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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-orange-600 dark:text-orange-500" />
          </div>
          <h1 className="text-4xl font-black">Cancellation & Refund Policy</h1>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 mb-10 flex gap-4">
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-1">Campus Credits Only</h3>
            <p className="text-blue-800 dark:text-blue-400 text-sm">
              All refunds on the Foodzie platform are processed exclusively in the form of <strong>Campus Credits</strong> returned to your wallet. We do not provide cash, UPI, or bank account refunds under any circumstances.
            </p>
          </div>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs">1</span>
              Vendor Rejections
            </h2>
            <p className="text-gray-600 dark:text-gray-400 ml-8">
              If a vendor rejects your order (e.g., due to an item being out of stock or the kitchen closing), your order is immediately cancelled and 100% of your spent Campus Credits are instantly refunded to your wallet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs">2</span>
              Pre-Preparation Cancellations
            </h2>
            <p className="text-gray-600 dark:text-gray-400 ml-8">
              Students can freely cancel their order directly from the app <strong>before</strong> the vendor marks the items as "Preparing". If you cancel during this grace period, you will receive a full refund of your Campus Credits immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs">3</span>
              Post-Preparation Cancellation Requests
            </h2>
            <p className="text-gray-600 dark:text-gray-400 ml-8">
              Once the vendor confirms the order and begins cooking, direct cancellation is disabled to prevent food waste. You may submit a "Cancellation Request", but the vendor holds the sole discretion to accept or deny it. If the vendor denies the request, no refund is provided, and you are expected to collect your food.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs">4</span>
              Uncollected Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400 ml-8">
              If a rider attempts to deliver your order but cannot reach you, or if you fail to pick up a self-pickup order within the allotted time frame, the order will be marked as completed. No refunds will be issued for uncollected food.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

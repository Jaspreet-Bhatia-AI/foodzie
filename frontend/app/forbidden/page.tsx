'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-orange-600 dark:text-orange-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          You do not have permission to view this page. If you believe this is an error, please ensure you are logged into the correct account type.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
          >
            Switch Account
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-md shadow-orange-500/20"
          >
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

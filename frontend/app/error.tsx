'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service safely
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Something went wrong</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          We encountered an unexpected error. Please try again or return to the safety of the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-md shadow-orange-500/20"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

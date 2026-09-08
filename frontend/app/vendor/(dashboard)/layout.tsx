'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Menu } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { getToken, decodeToken } from '@/lib/api';
import Sidebar from '@/components/vendor/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { brandName } = useBrand();
  const router = useRouter();
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setAuthState('unauthorized');
      router.replace('/login');
      return;
    }

    const payload = decodeToken<TokenPayload>(token);

    const isValid =
      payload !== null &&
      payload.role === 'Vendor' &&
      payload.exp > Date.now() / 1000;

    if (!isValid) {
      setAuthState('unauthorized');
      router.replace('/login');
      return;
    }

    setAuthState('authorized');
  }, [router]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ── Full-screen loader while we verify the token ──────────────────────────
  if (authState === 'checking' || authState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-gray-500 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  // ── Authorized: render sidebar + page content ─────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-950 text-white shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-white">{brandName} Canteen Portal</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 min-h-0 relative">
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
        {/* Offset main according to sidebar width */}
        <main className={`flex-1 transition-all duration-300 min-h-screen overflow-y-auto ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        } ml-0`}>
          {children}
        </main>
      </div>
    </div>
  );
}

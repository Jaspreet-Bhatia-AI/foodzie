'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getToken, decodeToken } from '@/lib/api';
import Sidebar from '@/components/vendor/Sidebar';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {/* Offset for fixed sidebar */}
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

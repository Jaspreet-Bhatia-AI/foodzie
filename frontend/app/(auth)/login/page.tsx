'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import Link from 'next/link';
import {
  Eye, EyeOff, UtensilsCrossed, Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { api, setToken, decodeToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

export default function LoginPage() {
  const { brandName } = useBrand();
  const router = useRouter();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Delivery' | 'Vendor'>('Student');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email: email.trim(), password });

      const payload = decodeToken<JwtPayload>(data.token);
      if (!payload) throw new Error('Invalid token received from server.');

      const userRoleLower = (payload.role || '').toLowerCase();
      const selectedRoleLower = selectedRole.toLowerCase();

      if (userRoleLower !== selectedRoleLower && !(userRoleLower === 'admin' && selectedRoleLower === 'vendor')) {
        const displayRole = selectedRole === 'Delivery' ? 'Rider' : selectedRole;
        throw new Error(`This account is not registered as a ${displayRole}. Please select the correct login role.`);
      }

      setToken(data.token);

      if (userRoleLower === 'vendor' || userRoleLower === 'admin') {
        router.replace('/vendor/inventory');
      } else if (userRoleLower === 'delivery') {
        router.replace('/delivery');
      } else {
        router.replace('/shop');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-orange-100/40 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950 flex items-center justify-center p-4 transition-colors duration-300 relative">
      
      {/* Branded Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/foodzie_bg_pattern.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0" />
      
      {/* Floating Theme Changer */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 mb-6 transition-colors group font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to {brandName}
        </Link>

        <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{brandName}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest">Welcome back</p>
          </div>

          {/* Role selector tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 mb-6 w-full font-bold">
            {(['Student', 'Delivery', 'Vendor'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`flex-1 py-2 text-xs rounded-lg transition-all uppercase tracking-wider font-bold ${
                  selectedRole === r
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-300'
                }`}
              >
                {r === 'Delivery' ? 'Rider' : r}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Email address / Username
              </label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu or Admin123"
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white font-bold rounded-xl py-3.5 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 disabled:translate-y-0 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-600 dark:text-orange-400 hover:underline font-bold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

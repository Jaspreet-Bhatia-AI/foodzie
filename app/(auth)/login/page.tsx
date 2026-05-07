'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, UtensilsCrossed, Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { api, setToken, decodeToken } from '@/lib/api';

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
  const router = useRouter();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email, password });

      // Decode JWT to determine where to redirect
      const payload = decodeToken<JwtPayload>(data.token);
      if (!payload) throw new Error('Invalid token received from server.');

      setToken(data.token);

      // ── Smart redirect based on role ──────────────────────────────────────
      if (payload.role === 'Vendor') {
        router.replace('/vendor/inventory');
      } else {
        // Student, Delivery, or any other role → shop
        router.replace('/shop');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 flex items-center justify-center p-4">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Foodzie
        </Link>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Foodzie</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1.5">
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
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 disabled:translate-y-0"
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

          {/* Switch to signup */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, UtensilsCrossed, Loader2, AlertCircle, ArrowLeft,
  GraduationCap, Store, MapPin, Search
} from 'lucide-react';
import { api, setToken, decodeToken } from '@/lib/api';

interface University {
  id: string;
  name: string;
}

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

type Role = 'Student' | 'Vendor';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function SignupForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Pre-select role from URL ?role=Vendor or ?role=Student
  const initialRole = (searchParams.get('role') as Role | null) ?? 'Student';

  const [role, setRole]                 = useState<Role>(initialRole);
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  
  // Combobox & Location state
  const [universityName, setUniversityName] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [userLat, setUserLat]           = useState<number | null>(null);
  const [userLng, setUserLng]           = useState<number | null>(null);

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Update role if URL param changes after mount
  useEffect(() => {
    const r = searchParams.get('role') as Role | null;
    if (r === 'Student' || r === 'Vendor') setRole(r);
  }, [searchParams]);

  // Request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => console.log("Geolocation denied or failed", err)
      );
    }
  }, []);

  // Fetch university suggestions
  useEffect(() => {
    const fetchUnis = async () => {
      try {
        let url = '/api/menu/universities';
        if (userLat !== null && userLng !== null) {
          url += `?lat=${userLat}&lng=${userLng}`;
        }
        const data = await api.get<{ universities: University[] }>(url);
        setUniversities(data.universities || []);
      } catch (err) {
        console.error("Failed to fetch universities", err);
      }
    };
    fetchUnis();
  }, [userLat, userLng]);

  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(universityName.toLowerCase())
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.post<AuthResponse>('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        universityName: universityName.trim(),
        lat: userLat,
        lng: userLng,
      });

      const payload = decodeToken<JwtPayload>(data.token);
      if (!payload) throw new Error('Invalid token received from server.');

      setToken(data.token);

      // ── Smart redirect based on role ──────────────────────────────────────
      if (payload.role === 'Vendor') {
        router.replace('/vendor/inventory');
      } else {
        router.replace('/shop');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 flex items-center justify-center p-4">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[200px] bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Back link */}
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
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Join Foodzie</h1>
            <p className="text-gray-400 text-sm mt-1">Create your account in seconds</p>
          </div>

          {/* ── Role selector ──────────────────────────────────────────────── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="role-student-btn"
                type="button"
                onClick={() => setRole('Student')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'Student'
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Student</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Order food on campus</p>
                </div>
              </button>

              <button
                id="role-vendor-btn"
                type="button"
                onClick={() => setRole('Vendor')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'Vendor'
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <Store className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Canteen Vendor</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Manage your canteen</p>
                </div>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-1.5">
                {role === 'Vendor' ? 'Canteen / Store Name' : 'Full Name'}
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'Vendor' ? 'e.g. Raj Canteen' : 'e.g. Jaswant Singh'}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* University Combobox */}
            <div className="relative">
              <label htmlFor="signup-university" className="block text-sm font-medium text-gray-300 mb-1.5">
                University Name
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/70" />
                <input
                  id="signup-university"
                  type="text"
                  required
                  value={universityName}
                  onChange={(e) => {
                    setUniversityName(e.target.value);
                    setShowUniDropdown(true);
                  }}
                  onFocus={() => setShowUniDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUniDropdown(false), 200)}
                  placeholder="e.g. Stanford University"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showUniDropdown && (
                <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-20">
                  <div className="max-h-52 overflow-y-auto p-1">
                    {filteredUnis.length > 0 ? (
                      filteredUnis.map(uni => (
                        <button
                          key={uni.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setUniversityName(uni.name);
                            setShowUniDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-colors"
                        >
                          {uni.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        <p>No vendors yet.</p>
                        <p className="text-xs mt-1 text-orange-500 font-medium">You can be the first to add this campus!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role pill — visual hint */}
            <div className={`text-xs rounded-xl px-4 py-2.5 border ${
              role === 'Vendor'
                ? 'bg-orange-500/5 border-orange-500/20 text-orange-400/80'
                : 'bg-blue-500/5 border-blue-500/20 text-blue-400/80'
            }`}>
              {role === 'Vendor'
                ? "🏪  You'll be taken to your Vendor Dashboard after signup."
                : "🎓  You'll be taken to the food ordering page after signup."}
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                `Create ${role === 'Vendor' ? 'Vendor' : 'Student'} Account`
              )}
            </button>
          </form>

          {/* Switch to login */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 13+
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}

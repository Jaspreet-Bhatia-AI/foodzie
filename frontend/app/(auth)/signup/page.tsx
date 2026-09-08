'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import Link from 'next/link';
import {
  Eye, EyeOff, UtensilsCrossed, Loader2, AlertCircle, ArrowLeft,
  GraduationCap, Store, MapPin, Phone
} from 'lucide-react';
import { api, setToken, decodeToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

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

function SignupForm() {
  const { brandName } = useBrand();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialRole = (searchParams.get('role') as Role | null) ?? 'Student';

  const [role, setRole]                 = useState<Role>(initialRole);
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [vendorUpi, setVendorUpi]       = useState('');
  
  const [universityName, setUniversityName] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [userLat, setUserLat]           = useState<number | null>(null);
  const [userLng, setUserLng]           = useState<number | null>(null);

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode]   = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    // Fetch universities for university autocomplete dropdown
    api.get<{ universities: University[] }>('/api/menu/universities')
      .then((data) => setUniversities(data.universities))
      .catch((err) => console.error('Failed to load universities:', err));

    // Get client geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data.countryCode) {
              const rcRes = await fetch(`https://restcountries.com/v3.1/alpha/${data.countryCode}`);
              const rcData = await rcRes.json();
              if (rcData && rcData[0] && rcData[0].idd) {
                const root = rcData[0].idd.root || '';
                const suffix = rcData[0].idd.suffixes?.[0] || '';
                setCountryCode(root + suffix);
              }
            }
          } catch (err) {
            console.error('Failed to get country code', err);
          }
        },
        () => console.warn('Geolocation access denied')
      );
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
        phone: phone.trim() ? `${countryCode} ${phone.trim()}`.trim() : undefined,
        role,
        universityName: universityName.trim(),
        lat: userLat,
        lng: userLng,
        ...(role === 'Vendor' ? { vendorUpi: vendorUpi.trim() } : {})
      });

      const payload = decodeToken<JwtPayload>(data.token);
      if (!payload) throw new Error('Invalid token received from server.');

      setToken(data.token);

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

  const filteredUnis = universities.filter((uni) =>
    uni.name.toLowerCase().includes(universityName.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-orange-100/40 dark:from-gray-955 dark:via-gray-900 dark:to-orange-950 flex items-center justify-center p-4 transition-colors duration-300 relative">
      
      {/* Branded Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/foodzie_bg_pattern.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0" />
      
      {/* Floating Theme Changer */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl my-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 mb-6 transition-colors group font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to {brandName}
        </Link>

        <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Join {brandName}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest">Create your account in seconds</p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-3 text-center">I am a…</p>
            <div className="grid grid-cols-2 gap-3 font-bold">
              <button
                id="role-student-btn"
                type="button"
                onClick={() => setRole('Student')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'Student'
                    ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-sm font-bold">Student</p>
                  <p className="text-[9px] opacity-70 mt-0.5">Order food on campus</p>
                </div>
              </button>

              <button
                id="role-vendor-btn"
                type="button"
                onClick={() => setRole('Vendor')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'Vendor'
                    ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Store className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-sm font-bold">Canteen Vendor</p>
                  <p className="text-[9px] opacity-70 mt-0.5">Manage your canteen</p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-650 dark:text-red-400 rounded-xl p-4 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {role === 'Vendor' ? 'Canteen / Store Name' : 'Full Name'}
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'Vendor' ? 'e.g. Your Canteen Name' : 'e.g. Jasspreet Bhatia'}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
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
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="signup-phone" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2 relative">
                <div className="relative w-24 shrink-0">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/70" />
                  <input
                    type="text"
                    readOnly
                    value={countryCode}
                    placeholder="+91"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl pl-10 pr-2 py-3 text-sm focus:outline-none transition-all font-medium cursor-not-allowed opacity-80"
                  />
                </div>
                <input
                  id="signup-phone"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) setPhone(val);
                  }}
                  placeholder="9876543210"
                  className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* University Selection */}
            <div className="relative">
              <label htmlFor="signup-uni" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                University / Campus
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/70" />
                <input
                  id="signup-uni"
                  type="text"
                  required
                  value={universityName}
                  onChange={(e) => {
                    setUniversityName(e.target.value);
                    setShowUniDropdown(true);
                  }}
                  onFocus={() => setShowUniDropdown(true)}
                  placeholder="Search and select campus..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
              </div>

              {/* Autocomplete list */}
              {showUniDropdown && universityName.trim() && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-20">
                  <div className="max-h-40 overflow-y-auto p-1 font-bold">
                    {filteredUnis.length > 0 ? (
                      filteredUnis.map((uni) => (
                        <button
                          key={uni.id}
                          type="button"
                          onClick={() => {
                            setUniversityName(uni.name);
                            setShowUniDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-950 rounded-xl transition-colors"
                        >
                          {uni.name}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUniDropdown(false)}
                        className="w-full text-left px-4 py-2.5 text-xs text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-950 rounded-xl transition-colors"
                      >
                        Create New: "{universityName}"
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vendor UPI Address */}
            {role === 'Vendor' && (
              <div className="md:col-span-2">
                <label htmlFor="signup-upi" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  UPI ID for Customer Payments
                </label>
                <input
                  id="signup-upi"
                  type="text"
                  required={role === 'Vendor'}
                  value={vendorUpi}
                  onChange={(e) => setVendorUpi(e.target.value)}
                  placeholder="e.g. store@upi or mobile@ybl"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
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
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 p-3 bg-orange-500/5 dark:bg-orange-500/5 border border-orange-500/10 dark:border-orange-500/10 rounded-2xl text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
              {role === 'Vendor'
                ? "🏪  You'll be taken to your Vendor Dashboard after signup."
                : "🎓  You'll be taken to the food ordering page after signup."}
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="md:col-span-2 w-full mt-1 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white font-bold rounded-xl py-3.5 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 disabled:translate-y-0 active:scale-98"
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

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 dark:text-orange-400 hover:underline font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}

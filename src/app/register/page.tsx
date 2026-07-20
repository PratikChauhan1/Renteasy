'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { validateUserRegistration, validatePassword } from '@/lib/validation';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<'OWNER' | 'TENANT'>('OWNER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSpec = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'OWNER' || roleParam === 'TENANT') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-validate client inputs
    const val = validateUserRegistration({ name, email, phone, password, role });
    if (!val.valid) {
      setError(val.error || 'Please fill in valid details.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Automatically log them in by calling login API
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        router.push('/login?registered=true');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#09090b]">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              RentEasy
            </span>
          </Link>
          <p className="text-sm text-zinc-400 text-center font-medium">Create an account to digitize your rental system.</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign Up</h2>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Tabs */}
          <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 mb-6">
            <button
              type="button"
              onClick={() => setRole('OWNER')}
              className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                role === 'OWNER'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-450 hover:text-white'
              }`}
            >
              Landlord / Owner
            </button>
            <button
              type="button"
              onClick={() => setRole('TENANT')}
              className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                role === 'TENANT'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-450 hover:text-white'
              }`}
            >
              Tenant / Resident
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="phone">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>

              {/* Password strength checklist */}
              {password.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-zinc-950/70 border border-white/5 space-y-1 text-[11px] animate-fade-in-up">
                  <p className="font-semibold text-zinc-400 mb-1 text-[10px] uppercase tracking-wider">Password Requirements:</p>
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumberOrSpec ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    {hasNumberOrSpec ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one number or special character</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-850/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm">Loading registration portal...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}

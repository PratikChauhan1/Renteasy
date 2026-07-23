'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle2, Home, Building2, Sparkles } from 'lucide-react';
import { validateUserRegistration } from '@/lib/validation';
import GoogleSignInButton from '@/components/GoogleSignInButton';

interface AuthSliderProps {
  initialMode?: 'signin' | 'signup';
}

export default function AuthSlider({ initialMode = 'signin' }: AuthSliderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode state: false = Sign In, true = Sign Up
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Sign Up state
  const [role, setRole] = useState<'OWNER' | 'TENANT'>('TENANT');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Google OAuth flow state
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setLoginSuccess('Account created! Please sign in to continue.');
    }
    const errParam = searchParams.get('error');
    if (errParam === 'oauth_failed') setLoginError('Google sign-in failed. Please try again.');
    if (errParam === 'oauth_no_code') setLoginError('Google authentication was cancelled.');
    if (errParam === 'no_email') setLoginError('Could not retrieve email from Google.');

    // Google OAuth redirect flow check
    const isGoogle = searchParams.get('google') === 'true';
    if (isGoogle) {
      setIsSignUp(true);
      setIsGoogleFlow(true);
      setGoogleEmail(searchParams.get('email') || '');
      setGoogleName(searchParams.get('name') || '');
      setGoogleAvatar(searchParams.get('avatar') || '');
    }
  }, [searchParams]);

  // Toggle between Sign In and Sign Up
  const toggleMode = (signUpState: boolean) => {
    setIsSignUp(signUpState);
    setLoginError('');
    setRegError('');
    const newPath = signUpState ? '/register' : '/login';
    window.history.pushState(null, '', newPath);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setLoginSuccess('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log in');
      setLoginSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const val = validateUserRegistration({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role,
    });
    if (!val.valid) {
      setRegError(val.error || 'Please fill in valid details.');
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName, phone: regPhone, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      // Auto login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      if (!loginRes.ok) {
        toggleMode(false);
        setLoginSuccess('Account registered successfully! Please sign in.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Google Registration completion (role selection)
  const handleGoogleComplete = async (selectedRole: 'OWNER' | 'TENANT') => {
    setGoogleLoading(true);
    setRegError('');
    try {
      const res = await fetch('/api/auth/google-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, name: googleName, role: selectedRole, avatarUrl: googleAvatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete registration.');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 sm:py-10 relative overflow-hidden bg-[#09090b]">
      {/* Background radial glows matching project theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header Logo overlay */}
      <div className="absolute top-4 left-5 sm:top-6 sm:left-8 z-50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            RentEasy
          </span>
        </Link>
      </div>

      {/* Main Container Card (Dark Glassmorphic Theme) */}
      <div className="relative w-full max-w-[880px] min-h-0 md:min-h-[580px] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-[28px] sm:rounded-[32px] shadow-[0_25px_60px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col md:flex-row z-10 mt-12 sm:mt-0">
        
        {/* Mobile top mode switch tab (visible only on small screens) */}
        <div className="flex md:hidden border-b border-zinc-800/80 p-1.5 bg-zinc-950/80">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${
              isSignUp ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 1. SIGN IN FORM CONTAINER (Left Half on Desktop, Full Width on Mobile)     */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.34,1.56,0.64,1) ${
            isSignUp
              ? 'hidden md:flex md:opacity-0 md:pointer-events-none md:translate-x-full z-1'
              : 'flex md:opacity-100 md:pointer-events-auto md:translate-x-0 z-2'
          }`}
        >
          <div className="max-w-[360px] mx-auto w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-3 sm:mb-4 tracking-tight">
              Sign In
            </h1>

            {/* Google Auth button */}
            <div className="flex justify-center mb-4">
              <GoogleSignInButton label="Continue with Google" iconOnly />
            </div>

            <p className="text-xs sm:text-sm text-center text-zinc-400 font-medium mb-6">
              or use your email password
            </p>

            {loginSuccess && (
              <div className="p-3 mb-5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {loginError && (
              <div className="p-3 mb-5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs sm:text-sm flex items-center gap-2" style={{ animation: 'shakeX 0.4s ease' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email or Phone"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>

              <div className="pt-3 text-center">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="glow-btn w-auto px-10 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'SIGN IN'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SIGN UP FORM CONTAINER (Right Half on Desktop, Full Width on Mobile)    */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.34,1.56,0.64,1) ${
            isSignUp
              ? 'flex md:opacity-100 md:pointer-events-auto md:translate-x-0 z-2'
              : 'hidden md:flex md:opacity-0 md:pointer-events-none md:-translate-x-full z-1'
          }`}
        >
          <div className="max-w-[360px] mx-auto w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-3 sm:mb-4 tracking-tight">
              Create Account
            </h1>

            {/* Role Toggle: Resident vs Landlord */}
            <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 mb-4">
              <button
                type="button"
                onClick={() => setRole('TENANT')}
                className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'TENANT' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" /> Resident
              </button>
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'OWNER' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" /> Landlord
              </button>
            </div>

            {/* Google OAuth Role Completion Flow */}
            {isGoogleFlow ? (
              <div className="rounded-xl p-3.5 bg-emerald-500/10 border border-emerald-500/20 mb-4 text-center">
                <p className="text-sm font-bold text-emerald-400 mb-1">Welcome, {googleName}!</p>
                <p className="text-xs text-zinc-400 mb-3">Select account type to complete setup:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGoogleComplete('TENANT')}
                    disabled={googleLoading}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />} Resident
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleComplete('OWNER')}
                    disabled={googleLoading}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />} Landlord
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Only Google Auth as social signup */}
                <div className="flex justify-center mb-3">
                  <GoogleSignInButton label="Sign up with Google" iconOnly />
                </div>

                <p className="text-xs sm:text-sm text-center text-zinc-400 font-medium mb-4">
                  or use your email for registration
                </p>
              </>
            )}

            {regError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs sm:text-sm flex items-center gap-2" style={{ animation: 'shakeX 0.4s ease' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {!isGoogleFlow && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Name"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-Digit Mobile"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (8+ chars)"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="glow-btn w-auto px-10 py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {regLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'SIGN UP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SLIDING OVERLAY PANEL (Desktop Curved Spring Morphing Animation)        */}
        {/* ========================================================================= */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 text-white z-30 transition-all duration-700 cubic-bezier(0.34,1.56,0.64,1) items-center justify-center p-10 text-center ${
            isSignUp
              ? 'translate-x-0 rounded-r-[160px]'
              : 'translate-x-full rounded-l-[160px]'
          }`}
          style={{
            boxShadow: isSignUp
              ? '12px 0 35px rgba(139,92,246,0.3)'
              : '-12px 0 35px rgba(139,92,246,0.3)',
          }}
        >
          {/* Inner glowing aura */}
          <div className="absolute inset-0 bg-radial from-purple-400/20 via-transparent to-transparent pointer-events-none" />

          {isSignUp ? (
            /* Overlay content when in SIGN UP mode → Invites user back to SIGN IN */
            <div className="max-w-[300px] relative z-10 animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-white flex items-center justify-center gap-2">
                Welcome Back! <Sparkles className="w-6 h-6 text-purple-300" />
              </h2>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed mb-8">
                Enter your personal details to use all of site features
              </p>
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="px-10 py-3 border-2 border-white/80 hover:bg-white hover:text-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                SIGN IN
              </button>
            </div>
          ) : (
            /* Overlay content when in SIGN IN mode → Invites user to SIGN UP */
            <div className="max-w-[300px] relative z-10 animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-white flex items-center justify-center gap-2">
                Hello Friend! <Sparkles className="w-6 h-6 text-purple-300" />
              </h2>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed mb-8">
                Register with your personal details to use all of site features
              </p>
              <button
                type="button"
                onClick={() => toggleMode(true)}
                className="px-10 py-3 border-2 border-white/80 hover:bg-white hover:text-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                SIGN UP
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, CreditCard, ClipboardList, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#09090b]">
      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            RentEasy
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-8 rounded bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden sm:inline">
                Welcome, <span className="text-white font-medium">{user.name}</span>
              </span>
              <Link
                href={user.role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant'}
                className="glow-btn px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-purple-400 transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="glow-btn px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-lg shadow-purple-500/20"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl animate-fade-in-up">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/25 mb-6 inline-block">
            Smart Rental & PG Management Platform
          </span>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 text-white">
            Rent Management{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate diaries, notebooks, and WhatsApp groups. Digitize property setups, generate bills, verify UPI QR payments, and resolve complaints on a single, stunning platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {user ? (
              <Link
                href={user.role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant'}
                className="glow-btn w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
              >
                Open Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register?role=OWNER"
                  className="glow-btn w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  Sign Up as Landlord <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/register?role=TENANT"
                  className="glass-panel glass-panel-hover w-full sm:w-auto px-8 py-4 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2"
                >
                  Join as Tenant
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-panel mt-auto py-8 text-center text-zinc-500 text-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">RentEasy</span>
            <span>- PG & Rental Home Management Platform</span>
          </div>
          <p>© {new Date().getFullYear()} RentEasy. Built StaySafe.</p>
        </div>
      </footer>
    </div>
  );
}

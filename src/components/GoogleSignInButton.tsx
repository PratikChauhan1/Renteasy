'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  iconOnly?: boolean;
  /** 'signin' = login flow, 'signup' = register flow (enables cross-role) */
  intent?: 'signin' | 'signup';
  /** The role the user selected on the register tab (only relevant for signup intent) */
  intendedRole?: 'OWNER' | 'TENANT';
}

export default function GoogleSignInButton({
  label = 'Continue with Google',
  className = '',
  iconOnly = false,
  intent = 'signin',
  intendedRole,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Store the intent + role in a short-lived cookie (5 min) so the
      // server-side /auth/callback can decide what to do for existing users.
      const expires = new Date(Date.now() + 5 * 60 * 1000).toUTCString();
      document.cookie = `oauth_intent=${intent}; path=/; expires=${expires}; SameSite=Lax`;
      if (intent === 'signup' && intendedRole) {
        document.cookie = `oauth_role=${intendedRole}; path=/; expires=${expires}; SameSite=Lax`;
      }

      const supabase = getSupabaseBrowserClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Google OAuth] Error:', error.message);
        setLoading(false);
      }
      // On success the browser redirects — no need to reset loading
    } catch (err: any) {
      console.error('[Google OAuth] Unexpected error:', err);
      setLoading(false);
    }
  };

  const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        title="Sign in with Google"
        className={`w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950/70 flex items-center justify-center shadow-md hover:bg-zinc-900 hover:border-purple-500/50 transition-all cursor-pointer disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        ) : (
          <GoogleLogo />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-purple-500/50 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span className="text-zinc-400">Redirecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleLogo />
          {label}
        </>
      )}
    </button>
  );
}

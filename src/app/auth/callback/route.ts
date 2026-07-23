import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

/**
 * /auth/callback
 *
 * Handles Supabase OAuth redirect after Google sign-in.
 * Reads `oauth_intent` and `oauth_role` cookies (set by GoogleSignInButton
 * before the redirect) to decide whether this is a sign-in or a cross-role
 * sign-up for an existing user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If Supabase/Google returned an explicit error
  if (errorParam || errorDescription) {
    const message = errorDescription || errorParam || 'Authentication failed';
    console.error('[OAuth] Error from provider:', { errorParam, errorDescription });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    console.error('[OAuth] No code param in callback URL:', request.url);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Google sign-in was not completed. Please try again.')}`
    );
  }

  // Build a mutable response so we can set cookies on it
  const response = NextResponse.redirect(`${origin}/dashboard`);

  const cookieStore = await cookies();

  // Read intent cookies set by GoogleSignInButton before the OAuth redirect
  const oauthIntent = cookieStore.get('oauth_intent')?.value ?? 'signin'; // 'signin' | 'signup'
  const oauthRole = cookieStore.get('oauth_role')?.value as 'OWNER' | 'TENANT' | undefined;

  // Clear intent cookies (they're one-time use)
  response.cookies.set('oauth_intent', '', { maxAge: 0, path: '/' });
  response.cookies.set('oauth_role', '', { maxAge: 0, path: '/' });

  // Create a Supabase SSR client that can read the PKCE code_verifier cookie
  const supabaseSSR = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          } catch {
            // Cookies can't be set in read-only server component context
          }
        },
      },
    }
  );

  // Exchange PKCE code for session
  const { data: sessionData, error: sessionError } = await supabaseSSR.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData?.user) {
    console.error('[OAuth] exchangeCodeForSession failed:', sessionError);
    const msg = sessionError?.message || 'Failed to complete Google authentication.';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }

  const googleUser = sessionData.user;
  const email = googleUser.email?.toLowerCase().trim();
  const name =
    googleUser.user_metadata?.full_name ||
    googleUser.user_metadata?.name ||
    email?.split('@')[0] ||
    'User';
  const avatarUrl = googleUser.user_metadata?.avatar_url || null;

  if (!email) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No email address provided by Google account.')}`
    );
  }

  // Check if user already exists in our custom User table
  const { data: existingUser } = await supabaseAdmin
    .from('User')
    .select('id, role, email, name')
    .eq('email', email)
    .single();

  if (existingUser) {
    const existingRole = existingUser.role as 'OWNER' | 'TENANT';

    // ─── Cross-role signup intent ───────────────────────────────────────────
    // The user is already registered but clicked Google from the register tab
    // with a DIFFERENT role selected → add the second role profile.
    if (oauthIntent === 'signup' && oauthRole && oauthRole !== existingRole) {
      // Call google-complete internally (server-to-server) to add the new role
      const completeUrl = new URL('/api/auth/google-complete', origin);
      const completeRes = await fetch(completeUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: existingUser.name || name,
          role: oauthRole, // the NEW role they want to add
          crossRole: true, // flag to tell google-complete this is an add-role op
        }),
      });

      const completeBody = await completeRes.json();

      if (!completeRes.ok) {
        const errMsg = completeBody?.error || 'Failed to add role.';
        return NextResponse.redirect(`${origin}/register?error=${encodeURIComponent(errMsg)}`);
      }

      // Issue JWT for the NEW role so they're signed in as the newly added role
      const token = signToken({ userId: existingUser.id, email, role: oauthRole });
      response.cookies.set('RentEasy_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // ─── Same-role signup intent or plain sign-in ───────────────────────────
    // If intent is signup with the SAME role they already have, just log in.
    // If intent is signin, just log in normally.
    const token = signToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingRole,
    });

    response.cookies.set('RentEasy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  }

  // ─── Brand-new Google user ─────────────────────────────────────────────────
  // Redirect to register page to pick a role
  const registerUrl = new URL('/register', origin);
  registerUrl.searchParams.set('google', 'true');
  registerUrl.searchParams.set('email', email);
  registerUrl.searchParams.set('name', name);
  if (avatarUrl) registerUrl.searchParams.set('avatar', avatarUrl);

  return NextResponse.redirect(registerUrl.toString());
}

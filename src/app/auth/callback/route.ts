import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * /auth/callback
 * 
 * Supabase redirects here after Google OAuth completes.
 * We exchange the code for a Supabase session, extract the user's
 * Google profile, then upsert them into our own User table and
 * issue our custom JWT cookie.
 *
 * Flow:
 *   - Existing user (has role) → set JWT → redirect to /dashboard
 *   - New user via Google → redirect to /register?google=true to pick role
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_no_code`);
  }

  // Create a temporary Supabase client to exchange the code
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData?.user) {
    console.error('OAuth callback error:', sessionError);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const googleUser = sessionData.user;
  const email = googleUser.email?.toLowerCase().trim();
  const name = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || email?.split('@')[0] || 'User';
  const avatarUrl = googleUser.user_metadata?.avatar_url || null;

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Check if this user already exists in our custom User table
  const { data: existingUser } = await supabaseAdmin
    .from('User')
    .select('id, role, email, name')
    .eq('email', email)
    .single();

  if (existingUser) {
    // Existing user — issue JWT and redirect to dashboard
    const token = signToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role as 'OWNER' | 'TENANT',
    });

    const cookieStore = await cookies();
    cookieStore.set('RentEasy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.redirect(`${origin}${next}`);
  }

  // New Google user — redirect to register page to pick role
  // We pass the google profile info as URL params (non-sensitive)
  const registerUrl = new URL('/register', origin);
  registerUrl.searchParams.set('google', 'true');
  registerUrl.searchParams.set('email', email);
  registerUrl.searchParams.set('name', name);
  if (avatarUrl) registerUrl.searchParams.set('avatar', avatarUrl);

  return NextResponse.redirect(registerUrl.toString());
}

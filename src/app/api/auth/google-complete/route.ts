import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/auth/google-complete
 *
 * Called after a new Google OAuth user has selected their role on the
 * register page. Creates the User row + role profile, then issues a JWT.
 */
export async function POST(request: Request) {
  try {
    const { email, name, role, avatarUrl } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (role !== 'OWNER' && role !== 'TENANT') {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Double-check the user doesn't already exist
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id, role')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      // Already registered — just issue a token
      const token = signToken({
        userId: existingUser.id,
        email: normalizedEmail,
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

      return NextResponse.json({ message: 'Logged in', alreadyExists: true });
    }

    // Create User — no password needed for OAuth users (set a random unusable hash)
    const userId = uuidv4();

    const { data: createdUser, error: userErr } = await supabaseAdmin
      .from('User')
      .insert({
        id: userId,
        email: normalizedEmail,
        password: '$google-oauth$', // non-bcrypt placeholder — can never be used to log in via password
        name: name.trim(),
        phone: null,
        role,
        avatarUrl: avatarUrl || null,
      })
      .select()
      .single();

    if (userErr || !createdUser) {
      return NextResponse.json(
        { error: 'Failed to create account: ' + userErr?.message },
        { status: 500 }
      );
    }

    // Create role profile
    if (role === 'OWNER') {
      await supabaseAdmin.from('OwnerProfile').insert({ id: uuidv4(), userId });
    } else {
      await supabaseAdmin.from('TenantProfile').insert({ id: uuidv4(), userId });
    }

    // Issue JWT cookie
    const token = signToken({ userId, email: normalizedEmail, role });

    const cookieStore = await cookies();
    cookieStore.set('RentEasy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ message: 'Google account registered successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Google complete error:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { cleanPhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email: identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/phone and password are required.' }, { status: 400 });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const phoneInput = cleanPhone(identifier);

    // Query database for either matching email or matching phone
    let query = supabaseAdmin
      .from('User')
      .select('*, ownerProfile:OwnerProfile(*), tenantProfile:TenantProfile(*)');

    if (phoneInput && phoneInput.length === 10 && /^\d+$/.test(phoneInput)) {
      query = query.or(`email.eq.${cleanInput},phone.eq.${phoneInput}`);
    } else {
      query = query.eq('email', cleanInput);
    }

    const { data: users, error } = await query;
    const user = users && users.length > 0 ? users[0] : null;

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email/phone or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email/phone or password.' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set('RentEasy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during login: ' + error.message }, { status: 500 });
  }
}


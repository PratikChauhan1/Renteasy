import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/auth/google-complete
 *
 * Two cases:
 * 1. NEW Google user — created after selecting a role on the register page.
 * 2. CROSS-ROLE — existing user adding a second role (crossRole: true flag).
 *    e.g. an Owner who also wants to register as a Resident.
 */
export async function POST(request: Request) {
  try {
    const { email, name, role, crossRole } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (role !== 'OWNER' && role !== 'TENANT') {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if user already exists ──────────────────────────────────────────
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id, role, email, name')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      const existingRole = existingUser.role as 'OWNER' | 'TENANT';

      // Same role → just issue a token (no action needed)
      if (existingRole === role) {
        const token = signToken({
          userId: existingUser.id,
          email: normalizedEmail,
          role: existingRole,
        });

        const cookieStore = await cookies();
        cookieStore.set('RentEasy_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return NextResponse.json({ message: 'Signed in successfully.', alreadyExists: true });
      }

      // ── Cross-role: add the opposite role profile ─────────────────────────
      if (role === 'OWNER') {
        // Check if OwnerProfile already exists
        const { data: existingOwner } = await supabaseAdmin
          .from('OwnerProfile')
          .select('id')
          .eq('userId', existingUser.id)
          .single();

        if (existingOwner) {
          return NextResponse.json(
            { error: 'You already have a Landlord/Owner profile with this Google account.' },
            { status: 400 }
          );
        }

        await supabaseAdmin.from('OwnerProfile').insert({ id: uuidv4(), userId: existingUser.id });
      } else {
        // Check if TenantProfile already exists
        const { data: existingTenant } = await supabaseAdmin
          .from('TenantProfile')
          .select('id')
          .eq('userId', existingUser.id)
          .single();

        if (existingTenant) {
          return NextResponse.json(
            { error: 'You already have a Resident/Tenant profile with this Google account.' },
            { status: 400 }
          );
        }

        await supabaseAdmin.from('TenantProfile').insert({ id: uuidv4(), userId: existingUser.id });
      }

      // Issue JWT for the newly-added role
      const token = signToken({
        userId: existingUser.id,
        email: normalizedEmail,
        role, // the new role
      });

      const cookieStore = await cookies();
      cookieStore.set('RentEasy_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      const roleName = role === 'OWNER' ? 'Landlord/Owner' : 'Resident/Tenant';
      return NextResponse.json({
        message: `${roleName} profile added to your Google account successfully.`,
        crossRole: true,
      });
    }

    // ── Brand-new Google user: create User + role profile ────────────────────
    const userId = uuidv4();

    const { data: createdUser, error: userErr } = await supabaseAdmin
      .from('User')
      .insert({
        id: userId,
        email: normalizedEmail,
        password: '$google-oauth$', // non-bcrypt placeholder — cannot log in via password
        name: name.trim(),
        phone: null,
        role,
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

    // Issue JWT
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
    console.error('[google-complete] Error:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { validateUserRegistration, cleanPhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, role } = await request.json();

    // 1. Strict Server-Side Field & Format Validation
    const validation = validateUserRegistration({ email, password, name, phone, role });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone ? cleanPhone(phone) : null;
    const requestedRoleName = role === 'OWNER' ? 'Landlord/Owner' : 'Resident/Tenant';

    // 2. Query existing user by Email OR Phone
    let query = supabaseAdmin
      .from('User')
      .select('id, email, phone, role, ownerProfile:OwnerProfile(id), tenantProfile:TenantProfile(id)');

    if (normalizedPhone) {
      query = query.or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`);
    } else {
      query = query.eq('email', normalizedEmail);
    }

    const { data: existingUsers, error: searchErr } = await query;

    if (searchErr) {
      console.error('Database search error during registration:', searchErr);
      return NextResponse.json({ error: 'Database error: ' + searchErr.message }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // Check if user ALREADY has a profile or primary role for the requested role
      const hasOwnerProfile = (existingUser.ownerProfile && existingUser.ownerProfile.length > 0) || existingUser.role === 'OWNER';
      const hasTenantProfile = (existingUser.tenantProfile && existingUser.tenantProfile.length > 0) || existingUser.role === 'TENANT';

      const alreadyHasRequestedRole = role === 'OWNER' ? hasOwnerProfile : hasTenantProfile;

      if (alreadyHasRequestedRole) {
        // Same role already registered with this email/phone → REJECT!
        return NextResponse.json({
          error: `An account with this email or phone number is already registered as ${requestedRoleName}. Please sign in instead.`
        }, { status: 400 });
      }

      // ── Cross-role registration: User exists as the OTHER role ─────────────
      // Add the requested role profile to existing user
      if (role === 'OWNER') {
        const { error: insertErr } = await supabaseAdmin
          .from('OwnerProfile')
          .insert({ id: uuidv4(), userId: existingUser.id });

        if (insertErr) {
          return NextResponse.json({ error: 'Failed to add Landlord profile: ' + insertErr.message }, { status: 500 });
        }
      } else {
        const { error: insertErr } = await supabaseAdmin
          .from('TenantProfile')
          .insert({ id: uuidv4(), userId: existingUser.id });

        if (insertErr) {
          return NextResponse.json({ error: 'Failed to add Resident profile: ' + insertErr.message }, { status: 500 });
        }
      }

      // If existing user didn't have phone, update it with current phone
      if (normalizedPhone && !existingUser.phone) {
        await supabaseAdmin.from('User').update({ phone: normalizedPhone }).eq('id', existingUser.id);
      }

      return NextResponse.json({
        message: `${requestedRoleName} profile added to your existing account successfully. You can now access both roles!`,
        crossRole: true
      }, { status: 201 });
    }

    // 3. New User Registration
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data: createdUser, error: userErr } = await supabaseAdmin
      .from('User')
      .insert({
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: normalizedPhone,
        role
      })
      .select()
      .single();

    if (userErr || !createdUser) {
      return NextResponse.json({ error: 'Failed to create user account: ' + userErr?.message }, { status: 500 });
    }

    // Create role profile
    if (role === 'OWNER') {
      await supabaseAdmin.from('OwnerProfile').insert({ id: uuidv4(), userId });
    } else {
      await supabaseAdmin.from('TenantProfile').insert({ id: uuidv4(), userId });
    }

    const { password: _, ...userWithoutPassword } = createdUser;
    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An error occurred during registration: ' + error.message }, { status: 500 });
  }
}

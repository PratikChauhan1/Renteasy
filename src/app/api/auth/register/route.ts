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

    // 2. Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id, role')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      // --- Cross-role registration logic ---
      if (existingUser.role === role) {
        // Same role → reject (already registered as this role)
        const roleName = role === 'OWNER' ? 'Landlord/Owner' : 'Resident/Tenant';
        return NextResponse.json({
          error: `An account is already registered as ${roleName} with this email. Please sign in instead.`
        }, { status: 400 });
      }

      // Different role → add the other role profile to existing user
      const existingUserId = existingUser.id;

      if (role === 'OWNER') {
        // Check if they already have an owner profile
        const { data: existingOwner } = await supabaseAdmin
          .from('OwnerProfile')
          .select('id')
          .eq('userId', existingUserId)
          .single();
        if (existingOwner) {
          return NextResponse.json({ error: 'You already have a Landlord profile with this email.' }, { status: 400 });
        }
        await supabaseAdmin.from('OwnerProfile').insert({ id: uuidv4(), userId: existingUserId });
      } else {
        // Check if they already have a tenant profile
        const { data: existingTenant } = await supabaseAdmin
          .from('TenantProfile')
          .select('id')
          .eq('userId', existingUserId)
          .single();
        if (existingTenant) {
          return NextResponse.json({ error: 'You already have a Resident profile with this email.' }, { status: 400 });
        }
        await supabaseAdmin.from('TenantProfile').insert({ id: uuidv4(), userId: existingUserId });
      }

      return NextResponse.json({
        message: `${role === 'OWNER' ? 'Landlord' : 'Resident'} profile added to your existing account successfully.`,
        crossRole: true
      }, { status: 201 });
    }

    // 3. Check if phone already exists (for fresh registrations)
    if (normalizedPhone) {
      const { data: existingPhone } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (existingPhone) {
        return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 4. Insert User with sanitized data
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

    // 5. Create role profile
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

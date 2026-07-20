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
    const { data: existingEmail } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 400 });
    }

    // 3. Check if phone already exists (if phone provided)
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


import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Email, password, name, and role are required.' }, { status: 400 });
    }

    if (role !== 'OWNER' && role !== 'TENANT') {
      return NextResponse.json({ error: 'Invalid role. Must be OWNER or TENANT.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert User
    const { data: createdUser, error: userErr } = await supabaseAdmin
      .from('User')
      .insert({ id: userId, email, password: hashedPassword, name, phone: phone || null, role })
      .select()
      .single();

    if (userErr || !createdUser) {
      return NextResponse.json({ error: 'Failed to create user: ' + userErr?.message }, { status: 500 });
    }

    // Create profile
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

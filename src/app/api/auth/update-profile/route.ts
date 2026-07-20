import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { isValidEmail, isValidPhone, cleanPhone, validatePassword } from '@/lib/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'RentEasy-super-secret-key-12345!';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('RentEasy_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, phone, email, address, password } = await request.json();

    const updateData: any = {};
    if (name) {
      if (name.trim().length < 2) {
        return NextResponse.json({ error: 'Full name must be at least 2 characters long.' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
      }
      // Check duplicate email
      const { data: existingEmail } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', payload.userId)
        .single();

      if (existingEmail) {
        return NextResponse.json({ error: 'This email is already in use by another account.' }, { status: 400 });
      }
      updateData.email = normalizedEmail;
    }

    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      if (!isValidPhone(phone)) {
        return NextResponse.json({ error: 'Invalid 10-digit mobile number starting with 6-9.' }, { status: 400 });
      }
      const normalizedPhone = cleanPhone(phone);
      // Check duplicate phone
      const { data: existingPhone } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('phone', normalizedPhone)
        .neq('id', payload.userId)
        .single();

      if (existingPhone) {
        return NextResponse.json({ error: 'This phone number is already in use by another account.' }, { status: 400 });
      }
      updateData.phone = normalizedPhone;
    } else if (phone === '') {
      updateData.phone = null;
    }

    if (address !== undefined) updateData.address = address.trim() || null;

    if (password) {
      const passCheck = validatePassword(password);
      if (!passCheck.valid) {
        return NextResponse.json({ error: passCheck.errors[0] }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', payload.userId)
      .select('id, name, email, phone, address, role')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error('[update-profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

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
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim() || null;
    if (email) updateData.email = email.trim().toLowerCase();
    if (address !== undefined) updateData.address = address.trim() || null;
    if (password && password.length >= 6) {
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


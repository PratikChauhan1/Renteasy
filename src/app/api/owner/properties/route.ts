import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { data: properties, error } = await supabaseAdmin
      .from('Property')
      .select('*, rooms:Room(*, tenants:TenantProfile(*, user:User(id,name,email,phone)))')
      .eq('ownerId', user.ownerProfile.id)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ properties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, address } = await request.json();
    if (!name || !address) return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
    const { data: property, error } = await supabaseAdmin
      .from('Property')
      .insert({ id: uuidv4(), name, address, ownerId: user.ownerProfile.id })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ property }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

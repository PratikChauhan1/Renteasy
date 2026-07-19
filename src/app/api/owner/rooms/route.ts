import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { propertyId, number, capacity, baseRent, securityDeposit, type } = await request.json();
    if (!propertyId || !number || capacity === undefined || baseRent === undefined) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    const { data: property } = await supabaseAdmin
      .from('Property').select('id,name').eq('id', propertyId).eq('ownerId', user.ownerProfile.id).single();
    if (!property) return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 403 });

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `${property.name.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${number}-${randomSuffix}`;

    const { data: room, error } = await supabaseAdmin
      .from('Room')
      .insert({ 
        id: uuidv4(), 
        number, 
        propertyId, 
        capacity: parseInt(capacity), 
        baseRent: parseFloat(baseRent), 
        securityDeposit: parseFloat(securityDeposit || 0),
        type: type || 'ROOM', 
        inviteCode 
      })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ room }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

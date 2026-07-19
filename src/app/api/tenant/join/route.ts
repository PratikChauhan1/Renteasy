import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'TENANT' || !user.tenantProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { inviteCode } = await request.json();
    if (!inviteCode) return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });

    const { data: room } = await supabaseAdmin.from('Room').select('*, property:Property(*, owner:OwnerProfile(*)), tenants:TenantProfile(id)').eq('inviteCode', inviteCode).single();
    if (!room) return NextResponse.json({ error: 'Invalid invite code. Room not found.' }, { status: 404 });
    if (room.tenants.length >= room.capacity) return NextResponse.json({ error: 'Room capacity has already been reached.' }, { status: 400 });
    if (user.tenantProfile.roomId) return NextResponse.json({ error: 'You are already registered in a room.' }, { status: 400 });

    await supabaseAdmin.from('TenantProfile').update({ roomId: room.id }).eq('id', user.tenantProfile.id);
    await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: room.property.owner.userId, senderId: user.id, title: 'New Tenant Joined', message: `${user.name} has joined Room ${room.number} at ${room.property.name}.` });

    return NextResponse.json({ message: 'Successfully joined the room!', room: { id: room.id, number: room.number, propertyName: room.property.name, address: room.property.address } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

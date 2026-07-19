import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { roomId } = await request.json();
    if (!roomId) return NextResponse.json({ error: 'Room ID is required.' }, { status: 400 });

    const { data: room } = await supabaseAdmin.from('Room').select('*, property:Property(name,ownerId)').eq('id', roomId).single();
    if (!room || room.property.ownerId !== user.ownerProfile.id) return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 403 });

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `${room.property.name.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${room.number}-${randomSuffix}`;

    const { error } = await supabaseAdmin.from('Room').update({ inviteCode }).eq('id', roomId);
    if (error) throw error;
    return NextResponse.json({ inviteCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

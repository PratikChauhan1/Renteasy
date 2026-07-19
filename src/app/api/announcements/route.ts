import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    if (user.role === 'TENANT' && user.tenantProfile) {
      if (!user.tenantProfile.roomId) return NextResponse.json({ announcements: [] });
      const { data: room } = await supabaseAdmin.from('Room').select('propertyId').eq('id', user.tenantProfile.roomId).single();
      if (!room) return NextResponse.json({ announcements: [] });
      const { data: announcements } = await supabaseAdmin.from('Announcement').select('*').eq('propertyId', room.propertyId).order('createdAt', { ascending: false });
      return NextResponse.json({ announcements: announcements || [] });
    } else if (user.role === 'OWNER' && user.ownerProfile) {
      const { data: properties } = await supabaseAdmin.from('Property').select('id').eq('ownerId', user.ownerProfile.id);
      const propIds = (properties || []).map((p: any) => p.id);
      if (propIds.length === 0) return NextResponse.json({ announcements: [] });
      const { data: announcements } = await supabaseAdmin.from('Announcement').select('*, property:Property(name)').in('propertyId', propIds).order('createdAt', { ascending: false });
      return NextResponse.json({ announcements: announcements || [] });
    }
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { propertyId, title, content } = await request.json();
    if (!propertyId || !title || !content) return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });

    const { data: property } = await supabaseAdmin.from('Property').select('id').eq('id', propertyId).eq('ownerId', user.ownerProfile.id).single();
    if (!property) return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 403 });

    const { data: announcement, error } = await supabaseAdmin.from('Announcement').insert({ id: uuidv4(), propertyId, title, content }).select().single();
    if (error) throw error;

    // Notify tenants
    const { data: rooms } = await supabaseAdmin.from('Room').select('id').eq('propertyId', propertyId);
    const roomIds = (rooms || []).map((r: any) => r.id);
    if (roomIds.length > 0) {
      const { data: tenants } = await supabaseAdmin.from('TenantProfile').select('userId').in('roomId', roomIds);
      if (tenants && tenants.length > 0) {
        const notifs = tenants.map((t: any) => ({ id: uuidv4(), receiverId: t.userId, senderId: user.id, title: `Announcement: ${title}`, message: content }));
        await supabaseAdmin.from('Notification').insert(notifs);
      }
    }
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

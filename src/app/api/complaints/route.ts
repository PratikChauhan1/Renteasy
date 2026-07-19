import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    if (user.role === 'TENANT' && user.tenantProfile) {
      const { data: complaints } = await supabaseAdmin.from('Complaint').select('*').eq('tenantId', user.tenantProfile.id).order('createdAt', { ascending: false });
      return NextResponse.json({ complaints: complaints || [] });
    } else if (user.role === 'OWNER' && user.ownerProfile) {
      const { data: properties } = await supabaseAdmin.from('Property').select('id').eq('ownerId', user.ownerProfile.id);
      const propIds = (properties || []).map((p: any) => p.id);
      if (propIds.length === 0) return NextResponse.json({ complaints: [] });
      const { data: rooms } = await supabaseAdmin.from('Room').select('id').in('propertyId', propIds);
      const roomIds = (rooms || []).map((r: any) => r.id);
      if (roomIds.length === 0) return NextResponse.json({ complaints: [] });
      const { data: tenants } = await supabaseAdmin.from('TenantProfile').select('id').in('roomId', roomIds);
      const tenantIds = (tenants || []).map((t: any) => t.id);
      if (tenantIds.length === 0) return NextResponse.json({ complaints: [] });
      const { data: complaints } = await supabaseAdmin.from('Complaint').select('*, tenant:TenantProfile(*, user:User(name,phone), room:Room(*, property:Property(*)))').in('tenantId', tenantIds).order('createdAt', { ascending: false });
      return NextResponse.json({ complaints: complaints || [] });
    }
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (user.role === 'TENANT' && user.tenantProfile) {
      const { title, description, category, urgency } = body;
      if (!title || !description || !category || !urgency) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      if (!user.tenantProfile.roomId) return NextResponse.json({ error: 'You must join a property/room before filing a complaint.' }, { status: 400 });

      const { data: complaint, error } = await supabaseAdmin.from('Complaint').insert({ id: uuidv4(), tenantId: user.tenantProfile.id, title, description, category, urgency, status: 'PENDING' }).select().single();
      if (error) throw error;

      const { data: roomData } = await supabaseAdmin.from('Room').select('number, property:Property(*, owner:OwnerProfile(*))').eq('id', user.tenantProfile.roomId).single();
      const room = roomData as any;
      if (room?.property?.owner?.userId) {
        await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: room.property.owner.userId, senderId: user.id, title: 'New Maintenance Complaint', message: `${user.name} filed a complaint: "${title}" (Urgency: ${urgency}) for Room ${room.number}.` });
      }
      return NextResponse.json({ complaint }, { status: 201 });
    } else if (user.role === 'OWNER' && user.ownerProfile) {
      const { complaintId, status, resolutionNote } = body;
      if (!complaintId || !status) return NextResponse.json({ error: 'Complaint ID and status are required' }, { status: 400 });

      const { data: complaint } = await supabaseAdmin.from('Complaint').select('*, tenant:TenantProfile(userId, room:Room(*, property:Property(*)))').eq('id', complaintId).single();
      if (!complaint || complaint.tenant.room?.property.ownerId !== user.ownerProfile.id) return NextResponse.json({ error: 'Complaint not found or unauthorized' }, { status: 404 });

      const { data: updated, error } = await supabaseAdmin.from('Complaint').update({ status, resolutionNote: resolutionNote || null, updatedAt: new Date().toISOString() }).eq('id', complaintId).select().single();
      if (error) throw error;

      await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: complaint.tenant.userId, senderId: user.id, title: 'Complaint Status Updated', message: `Your complaint "${complaint.title}" has been updated to "${status}". Note: ${resolutionNote || 'None'}.` });
      return NextResponse.json({ complaint: updated });
    }
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

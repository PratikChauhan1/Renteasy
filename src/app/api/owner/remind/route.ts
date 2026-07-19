import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { rentCycleId } = await request.json();
    if (!rentCycleId) return NextResponse.json({ error: 'Rent Cycle ID is required.' }, { status: 400 });

    const { data: rentCycle } = await supabaseAdmin
      .from('RentCycle')
      .select('*, tenant:TenantProfile(*, user:User(*), room:Room(*, property:Property(*)))')
      .eq('id', rentCycleId)
      .single();

    if (!rentCycle || rentCycle.tenant.room.property.ownerId !== user.ownerProfile.id) {
      return NextResponse.json({ error: 'Rent cycle not found or unauthorized.' }, { status: 404 });
    }

    const tenantUser = rentCycle.tenant.user;
    const roomNumber = rentCycle.tenant.room.number;

    await supabaseAdmin.from('Notification').insert({
      id: uuidv4(),
      receiverId: tenantUser.id,
      senderId: user.id,
      title: '?? Rent Payment Reminder',
      message: `Hi ${tenantUser.name}, this is a friendly reminder to pay the pending rent of ?${rentCycle.totalAmount.toLocaleString('en-IN')} for Room ${roomNumber} (${rentCycle.billingMonth}). Please submit your proof.`,
    });

    return NextResponse.json({
      message: 'System reminder notification sent to tenant.',
      tenantName: tenantUser.name,
      tenantPhone: tenantUser.phone || '',
      amount: rentCycle.totalAmount,
      month: rentCycle.billingMonth,
      roomNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
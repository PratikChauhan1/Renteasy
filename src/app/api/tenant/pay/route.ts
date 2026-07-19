import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'TENANT' || !user.tenantProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { rentCycleId, transactionId, screenshotUrl } = await request.json();
    if (!rentCycleId || !transactionId) return NextResponse.json({ error: 'Rent Cycle ID and Transaction UTR ID are required.' }, { status: 400 });

    const { data: rentCycle } = await supabaseAdmin.from('RentCycle').select('*, tenant:TenantProfile(*, user:User(*), room:Room(*, property:Property(*, owner:OwnerProfile(*))))').eq('id', rentCycleId).eq('tenantId', user.tenantProfile.id).single();
    if (!rentCycle || !rentCycle.tenant.room) return NextResponse.json({ error: 'Rent cycle not found or room not assigned.' }, { status: 404 });

    const ownerUserId = rentCycle.tenant.room.property.owner.userId;
    const roomNumber = rentCycle.tenant.room.number;

    await supabaseAdmin.from('Payment').insert({ id: uuidv4(), rentCycleId, tenantId: user.tenantProfile.id, amount: rentCycle.totalAmount, transactionId, screenshotUrl: screenshotUrl || null, status: 'PENDING' });
    await supabaseAdmin.from('RentCycle').update({ status: 'UNDER_VERIFICATION' }).eq('id', rentCycleId);
    await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: ownerUserId, senderId: user.id, title: 'Payment Proof Submitted', message: `${user.name} submitted payment proof for Room ${roomNumber} (${rentCycle.billingMonth}) - ₹${rentCycle.totalAmount}. UTR: ${transactionId}.` });

    return NextResponse.json({ message: 'Payment proof submitted successfully! Verification pending.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 });
  }
}

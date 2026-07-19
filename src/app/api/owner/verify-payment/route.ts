import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { paymentId, action, rejectionReason } = await request.json();
    if (!paymentId || !action) return NextResponse.json({ error: 'Payment ID and Action are required.' }, { status: 400 });
    if (action !== 'APPROVE' && action !== 'REJECT') return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

    const { data: payment } = await supabaseAdmin.from('Payment').select('*, rentCycle:RentCycle(*, tenant:TenantProfile(*, user:User(*), room:Room(*, property:Property(*))))').eq('id', paymentId).single();
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    if (payment.rentCycle.tenant.room.property.ownerId !== user.ownerProfile.id) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const tenantUserId = payment.rentCycle.tenant.userId;
    const roomNumber = payment.rentCycle.tenant.room.number;
    const billingMonth = payment.rentCycle.billingMonth;

    if (action === 'APPROVE') {
      await supabaseAdmin.from('Payment').update({ status: 'APPROVED', verifiedAt: new Date().toISOString() }).eq('id', paymentId);
      await supabaseAdmin.from('RentCycle').update({ status: 'PAID' }).eq('id', payment.rentCycleId);
      await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: tenantUserId, senderId: user.id, title: 'Rent Payment Approved', message: `Your payment of ?${payment.amount} for Room ${roomNumber} (${billingMonth}) has been approved.` });
      return NextResponse.json({ message: 'Payment approved and invoice marked as PAID.' });
    } else {
      await supabaseAdmin.from('Payment').update({ status: 'REJECTED', rejectionReason: rejectionReason || 'Transaction could not be verified.', verifiedAt: new Date().toISOString() }).eq('id', paymentId);
      await supabaseAdmin.from('RentCycle').update({ status: 'PENDING' }).eq('id', payment.rentCycleId);
      await supabaseAdmin.from('Notification').insert({ id: uuidv4(), receiverId: tenantUserId, senderId: user.id, title: 'Rent Payment Rejected', message: `Your payment for Room ${roomNumber} (${billingMonth}) was rejected. Reason: ${rejectionReason || 'Incorrect details'}.` });
      return NextResponse.json({ message: 'Payment rejected. Invoice reset to PENDING.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

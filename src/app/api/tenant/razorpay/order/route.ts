import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'TENANT' || !user.tenantProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rentCycleId } = await request.json();
    if (!rentCycleId) {
      return NextResponse.json({ error: 'Rent Cycle ID is required.' }, { status: 400 });
    }

    const { data: rentCycle, error } = await supabaseAdmin
      .from('RentCycle')
      .select('*, tenant:TenantProfile(*, user:User(*))')
      .eq('id', rentCycleId)
      .eq('tenantId', user.tenantProfile.id)
      .single();

    if (error || !rentCycle) {
      return NextResponse.json({ error: 'Rent cycle invoice not found.' }, { status: 404 });
    }

    if (rentCycle.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice has already been paid.' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(rentCycle.totalAmount * 100), // amount in paise
      currency: 'INR',
      receipt: rentCycle.id,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      tenantName: rentCycle.tenant.user.name,
      tenantEmail: rentCycle.tenant.user.email,
      tenantPhone: rentCycle.tenant.user.phone || '',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
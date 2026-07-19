import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { upiId, upiName, upiQrCode } = await request.json();
    if (!upiId || !upiName) return NextResponse.json({ error: 'UPI ID and Display Name are required.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('OwnerProfile').update({ upiId, upiName, upiQrCode: upiQrCode || null }).eq('id', user.ownerProfile.id).select().single();
    if (error) throw error;
    return NextResponse.json({ message: 'UPI payment settings updated successfully.', ownerProfile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

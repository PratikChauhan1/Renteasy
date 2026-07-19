import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'TENANT' || !user.tenantProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const roomId = user.tenantProfile.roomId;
    let tenantIds = [user.tenantProfile.id];
    
    if (roomId) {
      const { data: roommates } = await supabaseAdmin
        .from('TenantProfile')
        .select('id')
        .eq('roomId', roomId);
      if (roommates && roommates.length > 0) {
        tenantIds = roommates.map((r: any) => r.id);
      }
    }

    const { data: rentCycles, error } = await supabaseAdmin
      .from('RentCycle')
      .select('*, payments:Payment(*), tenant:TenantProfile(*, room:Room(*, property:Property(*, owner:OwnerProfile(*, user:User(name,email,phone)))))')
      .in('tenantId', tenantIds)
      .order('billingMonth', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ rentCycles: rentCycles || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

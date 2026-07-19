import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const { data: rentCycle, error } = await supabaseAdmin
      .from('RentCycle')
      .select('*, payments:Payment(*), tenant:TenantProfile(*, user:User(name,email,phone), room:Room(*, property:Property(*, owner:OwnerProfile(*, user:User(name,email,phone)))))')
      .eq('id', id)
      .single();
    if (error || !rentCycle) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });

    const isTenant = rentCycle.tenant.userId === user.id;
    const isOwner = rentCycle.tenant.room?.property.owner.userId === user.id;
    if (!isTenant && !isOwner) return NextResponse.json({ error: 'Unauthorized access to this receipt.' }, { status: 403 });

    return NextResponse.json({ rentCycle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
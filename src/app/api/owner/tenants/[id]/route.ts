import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;

    const { data: tenant, error } = await supabaseAdmin
      .from('TenantProfile')
      .select('*, user:User(*), room:Room(*, property:Property(*))')
      .eq('id', id)
      .single();

    if (error || !tenant) return NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 });
    if (tenant.room && tenant.room.property.ownerId !== user.ownerProfile.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { data: rentCycles } = await supabaseAdmin
      .from('RentCycle')
      .select('*, payments:Payment(*)')
      .eq('tenantId', id)
      .order('billingMonth', { ascending: false });

    const { data: complaints } = await supabaseAdmin
      .from('Complaint')
      .select('*')
      .eq('tenantId', id)
      .order('createdAt', { ascending: false });

    return NextResponse.json({ tenant, rentCycles: rentCycles || [], complaints: complaints || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
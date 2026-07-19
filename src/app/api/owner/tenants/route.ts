import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { 
      tenantId, 
      name, 
      email, 
      phone,
      roomNumber,
      roomType,
      baseRent,
      securityDeposit 
    } = await request.json();
    if (!tenantId || !name || !email) return NextResponse.json({ error: 'Tenant ID, Name, and Email are required.' }, { status: 400 });

    const { data: tenant } = await supabaseAdmin.from('TenantProfile').select('*, user:User(*), room:Room(*, property:Property(*))').eq('id', tenantId).single();
    if (!tenant || !tenant.room || tenant.room.property.ownerId !== user.ownerProfile.id) return NextResponse.json({ error: 'Tenant profile not found or unauthorized.' }, { status: 404 });

    if (email !== tenant.user.email) {
      const { data: emailExists } = await supabaseAdmin.from('User').select('id').eq('email', email).neq('id', tenant.userId).single();
      if (emailExists) return NextResponse.json({ error: 'This email address is already in use.' }, { status: 400 });
    }

    const { error: userErr } = await supabaseAdmin.from('User').update({ name, email, phone: phone || null }).eq('id', tenant.userId);
    if (userErr) throw userErr;

    if (tenant.roomId) {
      const { error: roomErr } = await supabaseAdmin.from('Room').update({
        number: roomNumber || tenant.room.number,
        type: roomType || tenant.room.type,
        baseRent: parseFloat(baseRent) || tenant.room.baseRent,
        securityDeposit: parseFloat(securityDeposit || 0)
      }).eq('id', tenant.roomId);
      if (roomErr) throw roomErr;
    }

    return NextResponse.json({ message: 'Tenant details updated successfully.', tenant: { id: tenant.id, name, email, phone } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Get all property IDs for this owner
    const { data: properties } = await supabaseAdmin.from('Property').select('id').eq('ownerId', user.ownerProfile.id);
    const propertyIds = (properties || []).map((p: any) => p.id);
    if (propertyIds.length === 0) return NextResponse.json({ rentCycles: [] });

    // Get rooms in those properties
    const { data: rooms } = await supabaseAdmin.from('Room').select('id').in('propertyId', propertyIds);
    const roomIds = (rooms || []).map((r: any) => r.id);
    if (roomIds.length === 0) return NextResponse.json({ rentCycles: [] });

    // Get tenant profiles in those rooms
    const { data: tenants } = await supabaseAdmin.from('TenantProfile').select('id').in('roomId', roomIds);
    const tenantIds = (tenants || []).map((t: any) => t.id);
    if (tenantIds.length === 0) return NextResponse.json({ rentCycles: [] });

    const { data: rentCycles, error } = await supabaseAdmin
      .from('RentCycle')
      .select('*, payments:Payment(*), tenant:TenantProfile(*, user:User(id,name,email,phone), room:Room(*, property:Property(*)))')
      .in('tenantId', tenantIds)
      .order('billingMonth', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ rentCycles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { 
      roomId, 
      billingMonth, 
      electricity, 
      water, 
      motorCharge, 
      securityDeposit,
      internet,
      cleaning,
      otherBills, 
      otherBillsNotes, 
      customCharges, 
      dueDate 
    } = await request.json();
    
    if (!roomId || !billingMonth || !dueDate) return NextResponse.json({ error: 'Room ID, Billing Month, and Due Date are required.' }, { status: 400 });

    const { data: room } = await supabaseAdmin.from('Room').select('*, property:Property(*)').eq('id', roomId).single();
    if (!room) return NextResponse.json({ error: 'Room/Unit not found.' }, { status: 404 });

    const { data: tenants } = await supabaseAdmin.from('TenantProfile').select('*, user:User(*)').eq('roomId', roomId);
    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ error: 'This room is currently vacant. No tenants assigned.' }, { status: 400 });
    }

    const tenantIds = tenants.map(t => t.id);
    const { data: existing } = await supabaseAdmin
      .from('RentCycle')
      .select('id, tenantId')
      .in('tenantId', tenantIds)
      .eq('billingMonth', billingMonth);

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: `Rent invoice for ${billingMonth} has already been generated for one or more tenants in this room.` 
      }, { status: 400 });
    }

    const baseRent = room.baseRent;
    const roommateCount = tenants.length;
    let secDeposit = parseFloat(securityDeposit || 0);
    let elecAmount = parseFloat(electricity || 0);
    let waterAmount = parseFloat(water || 0);
    let motorAmount = parseFloat(motorCharge || 0);
    let internetAmount = parseFloat(internet || 0);
    let cleaningAmount = parseFloat(cleaning || 0);
    let otherAmount = parseFloat(otherBills || 0);

    let splitNote = '';

    if (room.type === 'ROOM') {
      secDeposit = 0;
      waterAmount = 0;
      motorAmount = 0;

      if (roommateCount > 1) {
        elecAmount = elecAmount / roommateCount;
        internetAmount = internetAmount / roommateCount;
        cleaningAmount = cleaningAmount / roommateCount;
        otherAmount = otherAmount / roommateCount;
        splitNote = ` (Split for ${roommateCount} roommates)`;
      }
    } else {
      internetAmount = 0;
      cleaningAmount = 0;
    }

    let customSum = 0;
    const processedCustomCharges = (customCharges || []).map((c: any) => {
      const amt = parseFloat(c.amount || 0) / roommateCount;
      customSum += amt;
      return {
        label: c.label + (roommateCount > 1 ? ` (Split /${roommateCount})` : ''),
        amount: amt
      };
    });

    const totalAmount = baseRent + secDeposit + elecAmount + waterAmount + motorAmount + internetAmount + cleaningAmount + otherAmount + customSum;
    const finalOtherBillsNotes = otherBillsNotes ? (otherBillsNotes + splitNote) : (splitNote ? `Utility split` : null);

    const generatedInvoices = [];
    for (const tenant of tenants) {
      const invoiceId = uuidv4();
      const { data: rentCycle, error: insertError } = await supabaseAdmin.from('RentCycle')
        .insert({
          id: invoiceId,
          tenantId: tenant.id,
          billingMonth,
          baseRent,
          securityDeposit: secDeposit,
          electricity: elecAmount,
          water: waterAmount,
          motorCharge: motorAmount,
          internet: internetAmount,
          cleaning: cleaningAmount,
          otherBills: otherAmount,
          otherBillsNotes: finalOtherBillsNotes,
          customCharges: processedCustomCharges,
          totalAmount,
          dueDate: new Date(dueDate).toISOString(),
          status: 'PENDING',
        })
        .select().single();

      if (insertError) throw insertError;
      generatedInvoices.push(rentCycle);

      await supabaseAdmin.from('Notification').insert({ 
        id: uuidv4(), 
        receiverId: tenant.userId, 
        senderId: user.id, 
        title: 'New Rent Invoice Generated', 
        message: `Your rent invoice for ${billingMonth} has been generated. Total: ₹${totalAmount.toLocaleString('en-IN')}.` 
      });
    }

    return NextResponse.json({ message: `Rent invoices generated successfully for ${roommateCount} tenants.`, rentCycles: generatedInvoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 });
  }
}

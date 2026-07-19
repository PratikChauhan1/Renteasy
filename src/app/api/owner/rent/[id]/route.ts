import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to check ownership of rent cycle
async function checkOwnership(rentCycleId: string, ownerUserId: string) {
  const { data: rentCycle } = await supabaseAdmin
    .from('RentCycle')
    .select('*, tenant:TenantProfile(*, room:Room(*, property:Property(*, owner:OwnerProfile(*))))')
    .eq('id', rentCycleId)
    .single();

  if (!rentCycle || !rentCycle.tenant.room) {
    return { error: 'Invoice not found.', status: 404 };
  }

  const isOwner = rentCycle.tenant.room.property.owner.userId === ownerUserId;
  if (!isOwner) {
    return { error: 'Unauthorized access to this invoice.', status: 403 };
  }

  return { rentCycle };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { rentCycle, error, status } = await checkOwnership(id, user.id);
    if (error) return NextResponse.json({ error }, { status });

    return NextResponse.json({ rentCycle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { rentCycle, error, status } = await checkOwnership(id, user.id);
    if (error || !rentCycle) return NextResponse.json({ error }, { status });

    if (rentCycle.status === 'PAID') {
      return NextResponse.json({ error: 'Paid invoices cannot be modified.' }, { status: 400 });
    }

    const {
      billingMonth,
      baseRent,
      securityDeposit,
      electricity,
      water,
      motorCharge,
      internet,
      cleaning,
      otherBills,
      otherBillsNotes,
      customCharges,
      dueDate,
    } = await request.json();

    const updatedBaseRent = parseFloat(baseRent ?? rentCycle.baseRent);
    const updatedSecDeposit = parseFloat(securityDeposit ?? rentCycle.securityDeposit);
    const updatedElectricity = parseFloat(electricity ?? rentCycle.electricity);
    const updatedWater = parseFloat(water ?? rentCycle.water);
    const updatedMotor = parseFloat(motorCharge ?? rentCycle.motorCharge);
    const updatedInternet = parseFloat(internet ?? rentCycle.internet);
    const updatedCleaning = parseFloat(cleaning ?? rentCycle.cleaning);
    const updatedOther = parseFloat(otherBills ?? rentCycle.otherBills);

    let customSum = 0;
    const processedCustomCharges = (customCharges || rentCycle.customCharges || []).map((c: any) => {
      customSum += parseFloat(c.amount || 0);
      return {
        label: c.label,
        amount: parseFloat(c.amount || 0),
      };
    });

    const totalAmount =
      updatedBaseRent +
      updatedSecDeposit +
      updatedElectricity +
      updatedWater +
      updatedMotor +
      updatedInternet +
      updatedCleaning +
      updatedOther +
      customSum;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('RentCycle')
      .update({
        billingMonth: billingMonth || rentCycle.billingMonth,
        baseRent: updatedBaseRent,
        securityDeposit: updatedSecDeposit,
        electricity: updatedElectricity,
        water: updatedWater,
        motorCharge: updatedMotor,
        internet: updatedInternet,
        cleaning: updatedCleaning,
        otherBills: updatedOther,
        otherBillsNotes: otherBillsNotes ?? rentCycle.otherBillsNotes,
        customCharges: processedCustomCharges,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate).toISOString() : rentCycle.dueDate,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ message: 'Invoice updated successfully.', rentCycle: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER' || !user.ownerProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { rentCycle, error, status } = await checkOwnership(id, user.id);
    if (error || !rentCycle) return NextResponse.json({ error }, { status });

    if (rentCycle.status === 'PAID') {
      return NextResponse.json({ error: 'Paid invoices cannot be deleted.' }, { status: 400 });
    }

    // Delete associated payments first (if any)
    await supabaseAdmin.from('Payment').delete().eq('rentCycleId', id);

    // Delete rent cycle
    const { error: deleteErr } = await supabaseAdmin.from('RentCycle').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    return NextResponse.json({ message: 'Invoice deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Printer, ArrowLeft, Loader2, CheckCircle2, ShieldAlert, Building2 } from 'lucide-react';

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [rentCycle, setRentCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/receipts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve receipt details.');
        return res.json();
      })
      .then((data) => {
        setRentCycle(data.rentCycle);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm">Fetching digital receipt...</p>
      </div>
    );
  }

  if (error || !rentCycle) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-zinc-400">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-sm text-center max-w-md mb-6">{error || 'Receipt details not found'}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tenant = rentCycle.tenant;
  const room = tenant.room;
  const property = room.property;
  const landlord = property.owner;
  const approvedPayment = rentCycle.payments[0];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12 text-zinc-900 flex flex-col items-center justify-start print:bg-white print:p-0">
      
      {/* Action buttons */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 no-print text-zinc-400">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-semibold hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <button
          onClick={handlePrint}
          className="glow-btn flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-lg shadow-purple-500/10"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Digital Receipt Container */}
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        
        {/* Paid Stamp watermark */}
        <div className="absolute top-12 right-12 md:top-16 md:right-16 border-4 border-emerald-500 text-emerald-500 font-extrabold uppercase text-lg md:text-2xl px-4 py-1.5 rounded-xl rotate-12 select-none opacity-80 flex items-center gap-1.5">
          <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" /> Paid
        </div>

        {/* Header */}
        <div className="border-b border-zinc-100 pb-6 mb-8 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white print:bg-purple-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">RentEasy Receipt</h1>
            <p className="text-xs text-zinc-550">Smart Rental & PG Management Platform</p>
          </div>
        </div>

        {/* Invoice Metas */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-xs text-zinc-600">
          <div>
            <p className="text-zinc-400 uppercase font-bold tracking-wider mb-1 text-[10px]">Receipt ID</p>
            <p className="font-mono text-zinc-950 font-semibold uppercase">{rentCycle.id.substring(0, 18)}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 uppercase font-bold tracking-wider mb-1 text-[10px]">Billing Month</p>
            <p className="font-mono text-zinc-950 font-bold text-sm uppercase">{rentCycle.billingMonth}</p>
          </div>
        </div>

        {/* Parties grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y border-zinc-100 py-6 mb-8 text-xs leading-relaxed text-zinc-600">
          <div>
            <p className="text-zinc-400 uppercase font-bold tracking-wider mb-2 text-[10px]">Received From (Tenant)</p>
            <h4 className="font-bold text-zinc-950 text-sm mb-1">{tenant.user.name}</h4>
            <p>{property.name} - Room {room.number}</p>
            <p>Phone: {tenant.user.phone || 'N/A'}</p>
            <p>Email: {tenant.user.email}</p>
          </div>
          <div className="md:text-right">
            <p className="text-zinc-400 uppercase font-bold tracking-wider mb-2 text-[10px]">Paid To (Landlord)</p>
            <h4 className="font-bold text-zinc-950 text-sm mb-1">{landlord.upiName || landlord.user.name}</h4>
            <p>{property.name}</p>
            <p>Location: {property.address}</p>
            <p>UPI ID: {landlord.upiId || 'N/A'}</p>
          </div>
        </div>

        {/* Rents Breakdown */}
        <div className="space-y-4 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 border-b border-zinc-100 pb-2">Rent Breakdown</h4>
          <div className="space-y-2.5 text-xs text-zinc-650">
            <div className="flex justify-between">
              <span>Base Room Rent:</span>
              <span className="font-semibold text-zinc-900">₹{rentCycle.baseRent.toLocaleString('en-IN')}.00</span>
            </div>
            {rentCycle.securityDeposit > 0 && (
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.securityDeposit.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Electricity Utility Bill:</span>
              <span className="font-semibold text-zinc-900">₹{rentCycle.electricity.toLocaleString('en-IN')}.00</span>
            </div>
            {rentCycle.water > 0 && (
              <div className="flex justify-between">
                <span>Water Utility Bill:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.water.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            {rentCycle.internet > 0 && (
              <div className="flex justify-between">
                <span>Internet Charge:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.internet.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            {rentCycle.cleaning > 0 && (
              <div className="flex justify-between">
                <span>Cleaning Charge:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.cleaning.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            {rentCycle.motorCharge > 0 && (
              <div className="flex justify-between">
                <span>Motor Charge:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.motorCharge.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            {rentCycle.otherBills > 0 && (
              <div className="flex justify-between">
                <span>{rentCycle.otherBillsNotes || 'Other utility charges'}:</span>
                <span className="font-semibold text-zinc-900">₹{rentCycle.otherBills.toLocaleString('en-IN')}.00</span>
              </div>
            )}
            {rentCycle.customCharges && Array.isArray(rentCycle.customCharges) && rentCycle.customCharges.map((bill: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{bill.label}:</span>
                <span className="font-semibold text-zinc-900">₹{parseFloat(bill.amount || 0).toLocaleString('en-IN')}.00</span>
              </div>
            ))}
            
            <div className="flex justify-between border-t border-zinc-100 pt-3 text-sm font-extrabold text-zinc-950">
              <span>Total Rent Paid:</span>
              <span className="text-purple-700">₹{rentCycle.totalAmount.toLocaleString('en-IN')}.00</span>
            </div>
          </div>
        </div>

        {/* Payment Transaction details */}
        {approvedPayment && (
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-650 leading-relaxed">
            <h4 className="font-bold text-zinc-900 uppercase text-[9px] tracking-wider mb-2 text-purple-650">Transaction Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p>
                <span className="text-zinc-400">Payment Mode:</span> <span className="font-semibold text-zinc-900">UPI (Unified Payments Interface)</span>
              </p>
              <p>
                <span className="text-zinc-400">Reference / UTR ID:</span> <span className="font-mono font-bold text-zinc-900">{approvedPayment.transactionId}</span>
              </p>
              <p>
                <span className="text-zinc-400">Paid Date:</span> <span className="font-semibold text-zinc-900">{new Date(approvedPayment.paidAt).toLocaleDateString('en-IN')} {new Date(approvedPayment.paidAt).toLocaleTimeString('en-IN')}</span>
              </p>
              <p>
                <span className="text-zinc-400">Verified Date:</span> <span className="font-semibold text-zinc-900">{approvedPayment.verifiedAt ? new Date(approvedPayment.verifiedAt).toLocaleDateString('en-IN') : 'N/A'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-[10px] text-zinc-400 border-t border-zinc-100 pt-6 leading-normal">
          <p>This is a computer-generated digital payment receipt issued on RentEasy.</p>
          <p className="mt-1">For any queries regarding this receipt, please contact your landlord directly.</p>
        </div>

      </div>
    </div>
  );
}

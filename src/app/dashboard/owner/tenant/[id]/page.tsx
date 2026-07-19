'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Building2, Calendar, ShieldCheck, Mail, Phone,
  Receipt, FileText, CheckCircle2, AlertTriangle, Eye, Edit2, Trash2, X, Plus,
  Send, ShieldAlert, Sparkles, Loader2, DollarSign, Compass, Layers, Check
} from 'lucide-react';

export default function TenantDetailPage() {
  const router = useRouter();
  const { id: tenantId } = useParams() as { id: string };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editRoomType, setEditRoomType] = useState<'ROOM' | 'HOUSE'>('ROOM');
  const [editBaseRent, setEditBaseRent] = useState('');
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('');
  const [updating, setUpdating] = useState(false);

  // Active view screenshot
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState<string | null>(null);

  // Edit Invoice States
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editBillingMonth, setEditBillingMonth] = useState('');
  const [editInvoiceBaseRent, setEditInvoiceBaseRent] = useState('');
  const [editInvoiceSecurityDeposit, setEditInvoiceSecurityDeposit] = useState('');
  const [editInvoiceElectricity, setEditInvoiceElectricity] = useState('');
  const [editInvoiceWater, setEditInvoiceWater] = useState('');
  const [editInvoiceMotor, setEditInvoiceMotor] = useState('');
  const [editInvoiceInternet, setEditInvoiceInternet] = useState('');
  const [editInvoiceCleaning, setEditInvoiceCleaning] = useState('');
  const [editInvoiceOtherBills, setEditInvoiceOtherBills] = useState('');
  const [editInvoiceOtherBillsNotes, setEditInvoiceOtherBillsNotes] = useState('');
  const [editInvoiceCustomCharges, setEditInvoiceCustomCharges] = useState<any[]>([]);
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  const handleStartEditInvoice = (rc: any) => {
    setEditingInvoice(rc);
    setEditBillingMonth(rc.billingMonth || '');
    setEditInvoiceBaseRent(rc.baseRent?.toString() || '0');
    setEditInvoiceSecurityDeposit(rc.securityDeposit?.toString() || '0');
    setEditInvoiceElectricity(rc.electricity?.toString() || '0');
    setEditInvoiceWater(rc.water?.toString() || '0');
    setEditInvoiceMotor(rc.motorCharge?.toString() || '0');
    setEditInvoiceInternet(rc.internet?.toString() || '0');
    setEditInvoiceCleaning(rc.cleaning?.toString() || '0');
    setEditInvoiceOtherBills(rc.otherBills?.toString() || '0');
    setEditInvoiceOtherBillsNotes(rc.otherBillsNotes || '');
    setEditInvoiceCustomCharges(rc.customCharges || []);
    setEditInvoiceDueDate(rc.dueDate ? new Date(rc.dueDate).toISOString().substring(0, 10) : '');
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this rent invoice? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/owner/rent/${invoiceId}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (res.ok) {
        alert('Invoice deleted successfully.');
        fetchTenantDetails();
      } else {
        alert(resData.error || 'Failed to delete invoice.');
      }
    } catch (err: any) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setSavingInvoice(true);
    try {
      const res = await fetch(`/api/owner/rent/${editingInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingMonth: editBillingMonth,
          baseRent: parseFloat(editInvoiceBaseRent || '0'),
          securityDeposit: parseFloat(editInvoiceSecurityDeposit || '0'),
          electricity: parseFloat(editInvoiceElectricity || '0'),
          water: parseFloat(editInvoiceWater || '0'),
          motorCharge: parseFloat(editInvoiceMotor || '0'),
          internet: parseFloat(editInvoiceInternet || '0'),
          cleaning: parseFloat(editInvoiceCleaning || '0'),
          otherBills: parseFloat(editInvoiceOtherBills || '0'),
          otherBillsNotes: editInvoiceOtherBillsNotes,
          customCharges: editInvoiceCustomCharges,
          dueDate: editInvoiceDueDate,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert('Rent invoice updated successfully.');
        setEditingInvoice(null);
        fetchTenantDetails();
      } else {
        alert(resData.error || 'Failed to update invoice.');
      }
    } catch (err: any) {
      alert('Error updating invoice: ' + err.message);
    } finally {
      setSavingInvoice(false);
    }
  };

  const fetchTenantDetails = async () => {
    try {
      const res = await fetch(`/api/owner/tenants/${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);

      // Initialize edit fields
      setEditName(json.tenant.user.name);
      setEditEmail(json.tenant.user.email);
      setEditPhone(json.tenant.user.phone || '');
      if (json.tenant.room) {
        setEditRoomNumber(json.tenant.room.number);
        setEditRoomType(json.tenant.room.type);
        setEditBaseRent(json.tenant.room.baseRent.toString());
        setEditSecurityDeposit(json.tenant.room.securityDeposit?.toString() || '0');
      }
    } catch (err) {
      console.error(err);
      router.push('/dashboard/owner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/owner/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: editName,
          email: editEmail,
          phone: editPhone,
          roomNumber: editRoomNumber,
          roomType: editRoomType,
          baseRent: parseFloat(editBaseRent),
          securityDeposit: parseFloat(editSecurityDeposit || '0')
        })
      });
      const resJson = await res.json();
      if (res.ok) {
        alert('Tenant and Unit details updated successfully!');
        setIsEditing(false);
        fetchTenantDetails();
      } else {
        alert(resJson.error || 'Failed to update details.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReminder = async (rentCycleId: string) => {
    try {
      const res = await fetch('/api/owner/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentCycleId })
      });
      const resJson = await res.json();
      if (res.ok) {
        alert('System reminder notification sent to tenant!');
        
        // Prepare WhatsApp link
        if (resJson.tenantPhone) {
          const cleanPhone = resJson.tenantPhone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
          const messageText = `Dear ${resJson.tenantName}, this is a friendly reminder that your rent of Rs. ${resJson.amount} for ${resJson.month} is pending. Please make the payment via RentEasy. Thank you!`;
          const encodedText = encodeURIComponent(messageText);
          const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;
          window.open(waUrl, '_blank');
        } else {
          alert('Note: WhatsApp text reminder could not be opened because tenant has no phone number saved.');
        }
      } else {
        alert(resJson.error || 'Failed to send reminder.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading details...</p>
      </div>
    );
  }

  const { tenant, rentCycles, complaints } = data;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/owner"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25">
              Tenant Cockpit
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{tenant.user.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">
              Active Tenant Profile • {tenant.room ? `${tenant.room.property.name} - Room ${tenant.room.number}` : 'No room assigned'}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/5 cursor-pointer transition-all self-start md:self-auto"
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? 'Cancel Edit' : 'Edit Unit & Tenant'}
          </button>
        </div>

        {/* Editing Panel */}
        {isEditing && (
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 animate-fade-in-up">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-purple-500" /> Edit Profile & Unit Details
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              {tenant.room && (
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <p className="text-xs font-bold text-purple-400">🏡 Room / House Configuration</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Room Number / ID</label>
                      <input
                        type="text"
                        required
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">Unit Type</label>
                      <div className="relative flex p-1 bg-zinc-950 rounded-xl border border-zinc-800 w-full">
                        <button
                          type="button"
                          onClick={() => setEditRoomType('ROOM')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            editRoomType === 'ROOM' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Room
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditRoomType('HOUSE')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            editRoomType === 'HOUSE' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          House
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Monthly Base Rent (₹)</label>
                      <input
                        type="number"
                        required
                        value={editBaseRent}
                        onChange={(e) => setEditBaseRent(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={editSecurityDeposit}
                        onChange={(e) => setEditSecurityDeposit(e.target.value)}
                        disabled={editRoomType === 'ROOM'}
                        placeholder={editRoomType === 'ROOM' ? 'N/A' : 'e.g. 15000'}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="glow-btn px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Details Overview Cards */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Tenant contact profile card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <User className="w-4 h-4 text-purple-400" /> Personal Profile
              </h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-500 block">EMAIL ADDRESS</span>
                    <span className="text-white font-semibold truncate block">{tenant.user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-500 block">CONTACT NUMBER</span>
                    <span className="text-white font-semibold">{tenant.user.phone || 'Not available'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-500 block">DATE JOINED</span>
                    <span className="text-white font-semibold">{new Date(tenant.user.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Occupied Unit Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Building2 className="w-4 h-4 text-purple-400" /> Assigned Unit
              </h3>
              {tenant.room ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-base">
                      {tenant.room.type === 'HOUSE' ? `🏡 House ${tenant.room.number}` : `🚪 Room ${tenant.room.number}`}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded">
                      {tenant.room.type} Rent
                    </span>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                    <p className="flex justify-between text-xs">
                      <span className="text-zinc-500">Property:</span>
                      <span className="text-white font-bold">{tenant.room.property.name}</span>
                    </p>
                    <p className="flex justify-between text-xs">
                      <span className="text-zinc-500">Location:</span>
                      <span className="text-white font-bold">{tenant.room.property.address}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Base Rent</span>
                      <span className="text-white font-extrabold text-sm mt-0.5 block">₹{tenant.room.baseRent.toLocaleString('en-IN')}/mo</span>
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Sec. Deposit</span>
                      <span className="text-white font-extrabold text-sm mt-0.5 block">₹{(tenant.room.securityDeposit || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-550 text-center py-6">No room or unit assigned to this tenant profile yet.</p>
              )}
            </div>

          </div>

          {/* Right Column: Invoice History Ledger & Complaints */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rent Ledger History */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Receipt className="w-4 h-4 text-purple-400" /> Invoice History Ledger
              </h3>

              {rentCycles.length === 0 ? (
                <div className="text-center py-12 text-zinc-550 text-xs">
                  No previous month rent invoices generated.
                </div>
              ) : (
                <div className="space-y-4">
                  {rentCycles.map((rc: any) => {
                    const activePayment = rc.payments?.find((p: any) => p.status === 'PENDING');
                    return (
                      <div key={rc.id} className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs space-y-3 transition-colors hover:bg-white/10">
                        
                        {/* Month & Total header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="font-bold text-white text-sm">{rc.billingMonth}</span>
                            <span className="text-zinc-500 text-[10px] ml-2 font-mono">Cycle ID: {rc.id.substring(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-purple-400 text-sm">₹{rc.totalAmount.toLocaleString('en-IN')}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              rc.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : rc.status === 'UNDER_VERIFICATION'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {rc.status}
                            </span>
                          </div>
                        </div>

                        {/* Rent Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div>
                            <span className="text-zinc-550 block text-[9px] uppercase font-bold">Base Rent</span>
                            <span className="text-white">₹{rc.baseRent.toLocaleString('en-IN')}</span>
                          </div>
                          {rc.securityDeposit > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Sec. Deposit</span>
                              <span className="text-white">₹{rc.securityDeposit.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-zinc-550 block text-[9px] uppercase font-bold">Electricity</span>
                            <span className="text-white">₹{rc.electricity.toLocaleString('en-IN')}</span>
                          </div>
                          {rc.water > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Water</span>
                              <span className="text-white">₹{rc.water.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {rc.motorCharge > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Motor Charge</span>
                              <span className="text-white">₹{rc.motorCharge.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {rc.internet > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Internet</span>
                              <span className="text-white">₹{rc.internet.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {rc.cleaning > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Cleaning</span>
                              <span className="text-white">₹{rc.cleaning.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {rc.otherBills > 0 && (
                            <div>
                              <span className="text-zinc-550 block text-[9px] uppercase font-bold">Other Utility</span>
                              <span className="text-white">₹{rc.otherBills.toLocaleString('en-IN')} ({rc.otherBillsNotes || 'N/A'})</span>
                            </div>
                          )}
                        </div>

                        {/* Custom Bills List */}
                        {rc.customCharges && Array.isArray(rc.customCharges) && rc.customCharges.length > 0 && (
                          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 space-y-1.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Custom Utilities</span>
                            {rc.customCharges.map((bill: any, i: number) => (
                              <div key={i} className="flex justify-between text-zinc-400">
                                <span>{bill.label}</span>
                                <span className="text-white font-bold">₹{parseFloat(bill.amount || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Submissions & Reminders */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-2 mt-2">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Due: {new Date(rc.dueDate).toLocaleDateString('en-IN')}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {rc.status === 'PENDING' && (
                              <button
                                onClick={() => handleSendReminder(rc.id)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Send className="w-3 h-3" /> Send Payment Reminder
                              </button>
                            )}

                            {rc.status !== 'PAID' && (
                              <>
                                <button
                                  onClick={() => handleStartEditInvoice(rc)}
                                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-white/5"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit Bill
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(rc.id)}
                                  className="px-2.5 py-1.5 bg-red-650/10 hover:bg-red-650/20 text-rose-455 hover:text-rose-400 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-red-500/10"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </>
                            )}

                            {rc.payments && rc.payments.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                {rc.payments.map((pm: any) => (
                                  <div key={pm.id} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px]">
                                    <span className="text-zinc-400 font-bold">UTR ID:</span>
                                    <span className="font-mono text-white">{pm.transactionId}</span>
                                    {pm.screenshotUrl && (
                                      <button
                                        onClick={() => setActiveScreenshotUrl(pm.screenshotUrl)}
                                        className="text-purple-400 hover:text-purple-300 p-0.5 ml-1 cursor-pointer"
                                        title="View screenshot proof"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Complaints Cockpit */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <AlertTriangle className="w-4 h-4 text-purple-400" /> Maintenance Tickets
              </h3>

              {complaints.length === 0 ? (
                <p className="text-xs text-zinc-550 text-center py-6">No complaints filed by this tenant.</p>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c: any) => (
                    <div key={c.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex justify-between gap-3 items-start">
                      <div className="space-y-1">
                        <p className="font-bold text-white">{c.title}</p>
                        <p className="text-zinc-400 leading-normal">{c.description}</p>
                        <span className="text-[10px] text-zinc-650 mt-1.5 block">
                          Category: {c.category} • Raised on {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        {c.resolutionNote && (
                          <div className="mt-2 p-2 bg-purple-500/5 rounded border border-purple-500/10 text-purple-350">
                            <strong>Owner note:</strong> {c.resolutionNote}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border block mb-1 text-center ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {c.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border block text-center ${
                          c.urgency === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : c.urgency === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {c.urgency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Screenshot Overlay Modal */}
      {activeScreenshotUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-4 rounded-2xl max-w-lg w-full space-y-4 border border-white/10 relative">
            <button
              onClick={() => setActiveScreenshotUrl(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white">Payment Proof Screenshot</h3>
            <div className="rounded-xl overflow-hidden border border-white/5 bg-zinc-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeScreenshotUrl}
                alt="Payment proof screenshot"
                className="object-contain w-full max-h-[60vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Rent Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full border border-purple-500/20 relative my-8">
            <button
              onClick={() => setEditingInvoice(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-400" /> Edit Rent Invoice ({editBillingMonth})
            </h3>
            
            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Billing Month</label>
                  <input
                    type="month"
                    required
                    value={editBillingMonth}
                    onChange={(e) => setEditBillingMonth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editInvoiceDueDate}
                    onChange={(e) => setEditInvoiceDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Base Room Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={editInvoiceBaseRent}
                    onChange={(e) => setEditInvoiceBaseRent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceSecurityDeposit}
                    onChange={(e) => setEditInvoiceSecurityDeposit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Electricity Bill (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceElectricity}
                    onChange={(e) => setEditInvoiceElectricity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Water Bill (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceWater}
                    onChange={(e) => setEditInvoiceWater(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Motor Charge (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceMotor}
                    onChange={(e) => setEditInvoiceMotor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Internet Charge (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceInternet}
                    onChange={(e) => setEditInvoiceInternet(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cleaning Charge (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceCleaning}
                    onChange={(e) => setEditInvoiceCleaning(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Other Charge (₹)</label>
                  <input
                    type="number"
                    value={editInvoiceOtherBills}
                    onChange={(e) => setEditInvoiceOtherBills(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Other Charge Note</label>
                <input
                  type="text"
                  value={editInvoiceOtherBillsNotes}
                  onChange={(e) => setEditInvoiceOtherBillsNotes(e.target.value)}
                  placeholder="e.g. Broken lock replacement"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingInvoice}
                className="glow-btn w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {savingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  'Save Invoice Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
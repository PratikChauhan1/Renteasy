'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, LayoutDashboard, Receipt, AlertTriangle, Megaphone, LogOut, 
  Bell, Plus, Check, X, Copy, FileText, User, IndianRupee,
  Calendar, Key, Eye, HelpCircle, Phone, ArrowUpRight, CheckCircle2, Clock, Info, ShieldAlert, Loader2
} from 'lucide-react';

export default function TenantDashboard() {
  const router = useRouter();

  // Authentication & Navigation
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Data lists
  const [rentCycles, setRentCycles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Loaders
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Join Room Onboarding form
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Payment proof form
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // File uploads
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // Complaint form
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCat, setComplaintCat] = useState('Plumbing');
  const [complaintUrg, setComplaintUrg] = useState('LOW');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [copiedText, setCopiedText] = useState('');
  const [processingOnline, setProcessingOnline] = useState(false);

  // Profile edit states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      
      if (data.user.role !== 'TENANT') {
        router.replace('/dashboard/owner');
      } else {
        setUser(data.user);
      }
    } catch (err) {
      router.replace('/login');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [router]);

  // Fetch tenant data
  const fetchData = async () => {
    if (!user || !user.tenantProfile?.roomId) return;
    setLoadingData(true);
    try {
      const [rentRes, compRes, annRes, notifRes] = await Promise.all([
        fetch('/api/tenant/rent'),
        fetch('/api/complaints'),
        fetch('/api/announcements'),
        fetch('/api/notifications')
      ]);

      const [rentData, compData, annData, notifData] = await Promise.all([
        rentRes.json(),
        compRes.json(),
        annRes.json(),
        notifRes.json()
      ]);

      setRentCycles(rentData.rentCycles || []);
      setComplaints(compData.complaints || []);
      setAnnouncements(annData.announcements || []);
      setNotifications(notifData.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      alert('🎉 Payment successful! Digitally signed receipt generated.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      alert('❌ Payment failed: ' + decodeURIComponent(urlParams.get('error') || ''));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
    router.refresh();
  };

  const markNotificationsRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    const notifRes = await fetch('/api/notifications');
    const notifData = await notifRes.json();
    setNotifications(notifData.notifications || []);
  };

  // 1. Join Room Submit
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch('/api/tenant/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Joined room successfully!');
        setInviteCode('');
        // Re-fetch profile session to update state
        await fetchSession();
      } else {
        setJoinError(data.error || 'Failed to join room');
      }
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  // 2. Submit payment proof
  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !transactionId) return;
    setSubmittingPayment(true);

    try {
      const res = await fetch('/api/tenant/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentCycleId: selectedInvoice.id,
          transactionId,
          screenshotUrl: '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Payment proof submitted successfully! Pending verification.');
        setTransactionId('');
        setSelectedInvoice(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to submit payment proof');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) return;
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          address: profileAddress,
          ...(profilePassword ? { password: profilePassword } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, ...data.user }));
        setShowProfileModal(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  // 2.5 Razorpay Payment Flow
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!selectedInvoice) return;
    setProcessingOnline(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setProcessingOnline(false);
        return;
      }

      const orderRes = await fetch('/api/tenant/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentCycleId: selectedInvoice.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || 'Failed to generate Razorpay order.');
        setProcessingOnline(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RentEasy Platform',
        description: `Rent payment for ${orderData.tenantName}`,
        order_id: orderData.orderId,
        callback_url: `${window.location.origin}/api/tenant/razorpay/verify?rentCycleId=${selectedInvoice.id}`,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/tenant/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rentCycleId: selectedInvoice.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              alert('🎉 Payment successful! Digitally signed receipt generated.');
              setSelectedInvoice(null);
              fetchData();
            } else {
              alert(verifyData.error || 'Verification of signature failed.');
            }
          } catch (err: any) {
            alert('Verification request failed: ' + err.message);
          }
        },
        prefill: {
          name: orderData.tenantName,
          email: orderData.tenantEmail,
          contact: orderData.tenantPhone,
        },
        notes: {
          rentCycleId: selectedInvoice.id,
        },
        theme: {
          color: '#7c3aed',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert('Razorpay Payment failed to launch: ' + err.message);
    } finally {
      setProcessingOnline(false);
    }
  };

  // 3. Submit complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle || !complaintDesc) return;
    setSubmittingComplaint(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaintTitle,
          description: complaintDesc,
          category: complaintCat,
          urgency: complaintUrg,
        }),
      });
      if (res.ok) {
        alert('Complaint ticket created successfully!');
        setComplaintTitle('');
        setComplaintDesc('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to file complaint');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Dynamic UPI URL Generation for scannable QR
  const getDynamicUpiString = (upiId: string, upiName: string, amount: number) => {
    // Schema: upi://pay?pa=upiId&pn=upiName&am=amount&cu=INR
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`;
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading Tenant cockpit...</p>
      </div>
    );
  }

  // ONBOARDING SCREEN: Tenant has not joined a property room
  if (!user.tenantProfile?.roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#09090b]">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[80px]" />
        
        <div className="w-full max-w-md z-10 animate-fade-in-up">
          <div className="flex flex-col items-center mb-8">
            <Building2 className="w-12 h-12 text-purple-500 mb-2" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Onboard to RentEasy
            </h1>
            <p className="text-sm text-zinc-400 text-center mt-2">
              To get started, enter the invite code shared by your landlord/PG owner.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Join Property</h2>

            {joinError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. GREE-101-ABCD"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm font-mono text-center tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  'Link Room'
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-4">
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-zinc-500 hover:text-red-400 flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CORE DASHBOARD: Tenant has joined a property room
  const activeRoom = user.tenantProfile.room;
  const activeProperty = activeRoom.property;
  const landlord = activeProperty.owner;

  // Filter bills
  const activeInvoice = rentCycles.find((rc) => rc.status === 'PENDING' || rc.status === 'UNDER_VERIFICATION');

  const allPayments = rentCycles.flatMap((rc: any) =>
    (rc.payments || []).map((p: any) => ({
      ...p,
      billingMonth: rc.billingMonth
    }))
  ).sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            RentEasy
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25 ml-auto">
            Tenant
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Room Cockpit
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <Receipt className="w-5 h-5" /> Pay Rent & Bills
            </span>
            {activeInvoice?.status === 'PENDING' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black">
                Due
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-5 h-5" /> File Complaint
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-5 h-5" /> Announcements
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between z-45">
          <h1 className="text-lg font-bold text-white uppercase tracking-wider">
            {activeTab === 'overview' && 'Room Cockpit'}
            {activeTab === 'billing' && 'Billing Portal'}
            {activeTab === 'complaints' && 'Maintenance Request'}
            {activeTab === 'announcements' && 'Landlord Announcements'}
          </h1>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markNotificationsRead();
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-500 rounded-full border border-[#09090b]" />
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left animate-fade-in-up">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notifications</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-white/5 text-xs">
                          <p className="font-semibold text-white mb-0.5">{n.title}</p>
                          <p className="text-zinc-400 leading-normal">{n.message}</p>
                          <span className="text-[9px] text-zinc-600 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setProfileName(user.name || '');
                  setProfileEmail(user.email || '');
                  setProfilePhone(user.phone || '');
                  setProfileAddress(user.address || '');
                  setProfilePassword('');
                  setShowProfileModal(true);
                }}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
                title="Edit Profile"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm group-hover:bg-purple-500/20 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white hidden sm:inline">{user.name}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Views */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Room Card banner */}
              <div className="glass-panel p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between md:flex-row gap-6 items-start md:items-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div>
                  <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                    {activeProperty.name}
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mt-3">Room {activeRoom.number}</h2>
                  <p className="text-sm text-zinc-400 mt-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-zinc-500" /> {activeProperty.address}
                  </p>
                </div>

                <div className="glass-panel bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-xs space-y-2 shrink-0 w-full sm:w-auto">
                  <p className="flex justify-between gap-6">
                    <span className="text-zinc-500">My Rent:</span>
                    <span className="font-bold text-white">₹{activeRoom.baseRent.toLocaleString('en-IN')}/mo</span>
                  </p>
                  <p className="flex justify-between gap-6">
                    <span className="text-zinc-500">Sharing Mode:</span>
                    <span className="text-white font-medium">{activeRoom.capacity} sharing capacity</span>
                  </p>
                  <p className="flex justify-between gap-6">
                    <span className="text-zinc-500">Joined:</span>
                    <span className="text-white font-mono">{new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                  </p>
                </div>
              </div>

              {/* Landlord contact & Active bill preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Landlord Card */}
                <div className="glass-panel p-6 rounded-2xl h-fit">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Landlord Profile</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white text-lg font-bold">
                      {landlord?.user?.name.charAt(0).toUpperCase() || 'L'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{landlord?.user?.name || 'Owner'}</h4>
                      <p className="text-xs text-zinc-500">Host / Owner</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-xs border-t border-white/5 pt-4">
                    <p className="flex justify-between">
                      <span className="text-zinc-500">Mobile:</span>
                      <span className="text-white font-mono">{landlord?.user?.phone || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500">Email:</span>
                      <span className="text-white">{landlord?.user?.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500">UPI VPA:</span>
                      <span className="text-purple-400 font-mono">{landlord?.upiId || 'Not configured'}</span>
                    </p>
                  </div>
                </div>

                {/* Active bill alert */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Current Invoice Status</h3>
                    
                    {!activeInvoice ? (
                      <div className="py-8 text-center text-zinc-500 flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 opacity-20 mb-2" />
                        <p className="text-sm">Great! You have no pending invoices.</p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            activeInvoice.status === 'UNDER_VERIFICATION'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                          }`}>
                            {activeInvoice.status === 'UNDER_VERIFICATION' ? 'VERIFICATION PENDING' : 'UNPAID'}
                          </span>
                          <h4 className="text-2xl font-extrabold text-white mt-3">
                            ₹{activeInvoice.totalAmount.toLocaleString('en-IN')}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            Billing Month: <span className="font-mono text-zinc-300 font-bold">{activeInvoice.billingMonth}</span> • Due Date: {new Date(activeInvoice.dueDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>

                        <div className="text-xs text-zinc-450 space-y-1 bg-black/10 p-3 rounded-lg border border-white/5 self-start w-full sm:w-auto">
                          <p className="flex justify-between gap-4">
                            <span>Base Rent:</span>
                            <span className="text-white">₹{activeInvoice.baseRent}</span>
                          </p>
                          {activeInvoice.securityDeposit > 0 && (
                            <p className="flex justify-between gap-4 animate-fade-in-up">
                              <span>Security Deposit:</span>
                              <span className="text-white">₹{activeInvoice.securityDeposit}</span>
                            </p>
                          )}
                          <p className="flex justify-between gap-4">
                            <span>Electricity:</span>
                            <span className="text-white">₹{activeInvoice.electricity}</span>
                          </p>
                          {activeInvoice.water > 0 && (
                            <p className="flex justify-between gap-4 animate-fade-in-up">
                              <span>Water:</span>
                              <span className="text-white">₹{activeInvoice.water}</span>
                            </p>
                          )}
                          {activeInvoice.motorCharge > 0 && (
                            <p className="flex justify-between gap-4 animate-fade-in-up">
                              <span>Motor Charge:</span>
                              <span className="text-white">₹{activeInvoice.motorCharge}</span>
                            </p>
                          )}
                          {activeInvoice.internet > 0 && (
                            <p className="flex justify-between gap-4 animate-fade-in-up">
                              <span>Internet Charge:</span>
                              <span className="text-white">₹{activeInvoice.internet}</span>
                            </p>
                          )}
                          {activeInvoice.cleaning > 0 && (
                            <p className="flex justify-between gap-4 animate-fade-in-up">
                              <span>Cleaning Charge:</span>
                              <span className="text-white">₹{activeInvoice.cleaning}</span>
                            </p>
                          )}
                          {activeInvoice.otherBills > 0 && (
                            <p className="flex justify-between gap-4">
                              <span>{activeInvoice.otherBillsNotes || 'Other'}:</span>
                              <span className="text-white">₹{activeInvoice.otherBills}</span>
                            </p>
                          )}
                          {activeInvoice.customCharges && Array.isArray(activeInvoice.customCharges) && activeInvoice.customCharges.map((bill: any, index: number) => (
                            <p key={index} className="flex justify-between gap-4 animate-fade-in-up">
                              <span>{bill.label}:</span>
                              <span className="text-white">₹{bill.amount}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {activeInvoice && activeInvoice.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(activeInvoice);
                        setActiveTab('billing');
                      }}
                      className="glow-btn mt-6 w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer self-end"
                    >
                      Pay Rent Now <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & PAYMENT FLOW */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Payment Flow Drawer */}
              {selectedInvoice && (
                <div className="glass-panel p-6 rounded-2xl border-purple-500/20 shadow-purple-500/5 relative">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-purple-400" /> Rent Payment Options
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: QR Display & Intent */}
                    <div className="flex flex-col items-center justify-start p-6 bg-black/40 rounded-xl border border-white/5 text-center gap-3">
                      {/* Razorpay Instant Checkout */}
                      <div className="w-full border-b border-white/5 pb-4">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-2">⚡ RECOMMENDED PAYMENT METHOD</span>
                        <button
                          type="button"
                          onClick={handleRazorpayPayment}
                          disabled={processingOnline}
                          className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow shadow-purple-500/20 cursor-pointer transition-all"
                        >
                          {processingOnline ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-4 h-4" /> Pay Instantly with Razorpay
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">Supports UPI, Debit/Credit Cards, Wallets, and Netbanking (Instant Receipt)</p>
                      </div>

                      {(!landlord?.upiId || !landlord?.upiName) ? (
                        <div className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-left text-xs text-zinc-500">
                          <p className="font-semibold text-zinc-400">Manual Scanner Transfers Disabled</p>
                          <p className="mt-1">Landlord has not configured their personal UPI VPA for direct scanning. Please use Razorpay above.</p>
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest mt-2">Or Scan UPI QR Code (Manual Verification)</span>
                          
                          <div className="p-3 bg-white rounded-2xl mb-4 w-52 h-52 flex items-center justify-center shadow-lg">
                            <img
                              src={
                                landlord.upiQrCode ||
                                `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                  getDynamicUpiString(landlord.upiId, landlord.upiName, selectedInvoice.totalAmount)
                                )}`
                              }
                              alt="Scan to Pay QR"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <p className="text-xs text-zinc-400 mb-2">Merchant Name: <span className="font-semibold text-white">{landlord.upiName}</span></p>
                          
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs w-full max-w-xs mb-4">
                            <span className="font-mono text-purple-400 flex-1 truncate select-all">{landlord.upiId}</span>
                            <button
                              onClick={() => copyToClipboard(landlord.upiId)}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              {copiedText === landlord.upiId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* UPI Intent Button */}
                          <a
                            href={getDynamicUpiString(landlord.upiId, landlord.upiName, selectedInvoice.totalAmount)}
                            className="glow-btn w-full max-w-xs py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                          >
                          </a>
                        </>
                      )}
                    </div>

                      {/* Right: Submit Proof Form */}
                      <form onSubmit={handleSubmitPaymentProof} className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-xs text-zinc-300">
                            <h4 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wider text-purple-400">Invoice Summary</h4>
                            <p className="flex justify-between"><span>Base Rent:</span><span className="text-white font-semibold">₹{selectedInvoice.baseRent}</span></p>
                            {selectedInvoice.securityDeposit > 0 && (
                              <p className="flex justify-between animate-fade-in-up"><span>Security Deposit:</span><span className="text-white font-semibold">₹{selectedInvoice.securityDeposit}</span></p>
                            )}
                            <p className="flex justify-between"><span>Electricity:</span><span className="text-white font-semibold">₹{selectedInvoice.electricity}</span></p>
                            {selectedInvoice.water > 0 && (
                              <p className="flex justify-between animate-fade-in-up"><span>Water:</span><span className="text-white font-semibold">₹{selectedInvoice.water}</span></p>
                            )}
                            {selectedInvoice.motorCharge > 0 && (
                              <p className="flex justify-between animate-fade-in-up"><span>Motor Charge:</span><span className="text-white font-semibold">₹{selectedInvoice.motorCharge}</span></p>
                            )}
                            {selectedInvoice.internet > 0 && (
                              <p className="flex justify-between animate-fade-in-up"><span>Internet Charge:</span><span className="text-white font-semibold">₹{selectedInvoice.internet}</span></p>
                            )}
                            {selectedInvoice.cleaning > 0 && (
                              <p className="flex justify-between animate-fade-in-up"><span>Cleaning Charge:</span><span className="text-white font-semibold">₹{selectedInvoice.cleaning}</span></p>
                            )}
                            {selectedInvoice.otherBills > 0 && (
                              <p className="flex justify-between"><span>{selectedInvoice.otherBillsNotes || 'Other'}:</span><span className="text-white font-semibold">₹{selectedInvoice.otherBills}</span></p>
                            )}
                            {selectedInvoice.customCharges && Array.isArray(selectedInvoice.customCharges) && selectedInvoice.customCharges.map((bill: any, index: number) => (
                              <p key={index} className="flex justify-between animate-fade-in-up"><span>{bill.label}:</span><span className="text-white font-semibold">₹{bill.amount}</span></p>
                            ))}
                            <p className="flex justify-between border-t border-white/5 pt-2 font-bold text-sm text-purple-400">
                              <span>Total Amount:</span><span>₹{selectedInvoice.totalAmount}</span>
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                              UPI Transaction ID (UTR Ref Number)
                            </label>
                            <input
                              type="text"
                              required
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="e.g. 612847192749 (12-digit number)"
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-550 focus:outline-none focus:border-purple-550 text-sm font-mono"
                            />
                          </div>


                        </div>

                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="glow-btn w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                        >
                          {submittingPayment ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                          ) : (
                            'Submit Payment Proof'
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

              {/* Invoices List */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" /> Invoice History
                </h3>

                {rentCycles.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">No rent invoices generated for your room yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-450 text-xs uppercase font-semibold">
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4">Base Rent</th>
                          <th className="py-3 px-4">Utilities</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rentCycles.map((rc) => (
                          <tr key={rc.id} className="text-zinc-350 hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white font-mono">{rc.billingMonth}</td>
                            <td className="py-3.5 px-4">₹{rc.baseRent.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4 text-xs leading-normal">
                              <div>Elec: ₹{rc.electricity} {rc.water > 0 && `• Water: ₹${rc.water}`}</div>
                              {rc.securityDeposit > 0 && <div className="text-[10px] text-zinc-400">Security Deposit: ₹{rc.securityDeposit}</div>}
                              {rc.motorCharge > 0 && <div className="text-[10px] text-indigo-400">Motor Charge: ₹{rc.motorCharge}</div>}
                              {rc.internet > 0 && <div className="text-[10px] text-indigo-400">Internet: ₹{rc.internet}</div>}
                              {rc.cleaning > 0 && <div className="text-[10px] text-indigo-400">Cleaning: ₹{rc.cleaning}</div>}
                              {rc.otherBills > 0 && <div className="text-[10px] text-zinc-500">{rc.otherBillsNotes || 'Other'}: ₹{rc.otherBills}</div>}
                              {rc.customCharges && Array.isArray(rc.customCharges) && rc.customCharges.map((bill: any, idx: number) => (
                                <div key={idx} className="text-[10px] text-purple-400">{bill.label}: ₹{bill.amount}</div>
                              ))}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">₹{rc.totalAmount.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                                rc.status === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : rc.status === 'UNDER_VERIFICATION'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                              }`}>
                                {rc.status === 'UNDER_VERIFICATION' ? 'VERIFYING' : rc.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono">
                              {new Date(rc.dueDate).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              {rc.status === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(rc);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 text-white font-semibold rounded-lg cursor-pointer shadow shadow-purple-500/10"
                                >
                                  Pay Rent
                                </button>
                              )}
                              {rc.status === 'PAID' && (
                                <Link
                                  href={`/receipt/${rc.id}`}
                                  target="_blank"
                                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" /> Receipt PDF
                                </Link>
                              )}
                              {rc.status === 'UNDER_VERIFICATION' && (
                                <span className="text-xs text-zinc-550">Reviewing Proof</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment Proofs List */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-450" /> Payment Submissions Log
                </h3>
                <p className="text-xs text-zinc-450">
                  Track your submitted transactions, payment dates, reference IDs, and verification statuses.
                </p>

                {allPayments.length === 0 ? (
                  <p className="text-sm text-zinc-550 py-6 text-center">No payment transactions submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-450 text-xs uppercase font-semibold">
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Submitted Date</th>
                          <th className="py-3 px-4">UTR Ref ID</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {allPayments.map((p: any) => (
                          <tr key={p.id} className="text-zinc-350 hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white font-mono">{p.billingMonth}</td>
                            <td className="py-3.5 px-4 font-semibold">₹{p.amount.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4 text-xs font-mono">
                              {new Date(p.paidAt).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">{p.transactionId}</td>
                            <td className="py-3.5 px-4">
                              <div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  p.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : p.status === 'REJECTED'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  {p.status}
                                </span>
                                {p.status === 'REJECTED' && p.rejectionReason && (
                                  <p className="text-[10px] text-rose-450 mt-1 max-w-[200px] leading-tight">
                                    Reason: {p.rejectionReason}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form */}
                <div className="glass-panel p-6 rounded-2xl h-fit">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-purple-500" /> Log Maintenance Ticket
                  </h3>
                  <form onSubmit={handleCreateComplaint} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Issue Title</label>
                      <input
                        type="text"
                        required
                        value={complaintTitle}
                        onChange={(e) => setComplaintTitle(e.target.value)}
                        placeholder="e.g. Bathroom sink pipe leaking"
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
                        <select
                          value={complaintCat}
                          onChange={(e) => setComplaintCat(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                        >
                          <option value="Plumbing">Plumbing</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Internet/WiFi">Internet/Wi-Fi</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Appliance">Appliance</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Urgency Level</label>
                        <select
                          value={complaintUrg}
                          onChange={(e) => setComplaintUrg(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                        >
                          <option value="LOW">LOW (Can wait)</option>
                          <option value="MEDIUM">MEDIUM (Needs attention)</option>
                          <option value="HIGH">HIGH (Urgent repair)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
                      <textarea
                        required
                        value={complaintDesc}
                        onChange={(e) => setComplaintDesc(e.target.value)}
                        placeholder="Explain the issue in detail so your landlord knows what needs repair..."
                        rows={4}
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-550 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingComplaint}
                      className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
                    >
                      {submittingComplaint ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        'Submit Ticket'
                      )}
                    </button>
                  </form>
                </div>

                {/* History */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <AlertTriangle className="w-5 h-5 text-purple-400" /> My Complaint History
                  </h3>

                  {complaints.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-12 text-center">No complaints filed yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {complaints.map((c) => (
                        <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 border ${
                                c.urgency === 'HIGH'
                                  ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                                  : c.urgency === 'MEDIUM'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {c.urgency} Urgency
                              </span>
                              <span className="text-zinc-500 text-xs font-semibold">Category: {c.category}</span>
                              <h4 className="font-bold text-white text-base mt-2">{c.title}</h4>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                              c.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : c.status === 'IN_PROGRESS'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                            }`}>
                              {c.status}
                            </span>
                          </div>

                          <p className="text-zinc-350 text-sm leading-relaxed p-3 bg-black/20 rounded-lg border border-white/5">
                            {c.description}
                          </p>

                          <div className="flex justify-between text-xs text-zinc-550 border-t border-white/5 pt-2">
                            <span>Ticket ID: #{c.id.substring(0, 8)}</span>
                            <span>Filed: {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>

                          {c.resolutionNote && (
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-450">
                              <p className="font-bold">Landlord Resolution Note:</p>
                              <p className="mt-0.5">{c.resolutionNote}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                  <Megaphone className="w-5 h-5 text-purple-500 animate-bounce" /> Landlord Announcements
                </h3>

                {announcements.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-12 text-center">No announcements from your landlord yet.</p>
                ) : (
                  <div className="space-y-6">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-white text-base">{a.title}</h4>
                          <span className="text-xs text-zinc-500 font-mono">
                            {new Date(a.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-zinc-350 text-sm leading-relaxed p-3 bg-black/10 rounded-lg border border-white/5 whitespace-pre-wrap">
                          {a.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======= PROFILE EDIT MODAL ======= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-lg">
                  {profileName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Profile</h3>
                  <p className="text-[11px] text-zinc-500">Changes sync to database instantly</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Address</label>
                <textarea
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="Your full address..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">New Password <span className="text-zinc-600">(leave blank to keep current)</span></label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {savingProfile ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                ) : (
                  'Save Profile Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

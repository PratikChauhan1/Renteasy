'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsQR from 'jsqr';
import { 
  Building2, LayoutDashboard, Receipt, AlertTriangle, Megaphone, Settings, 
  LogOut, Bell, Plus, Check, X, Copy, FileText, Upload, User, IndianRupee,
  Calendar, Key, Eye, HelpCircle, Phone, ArrowUpRight, TrendingUp, Sparkles, CheckCircle2, Clock, Loader2
} from 'lucide-react';

export default function OwnerDashboard() {
  const router = useRouter();
  
  // Authentication & Navigation state
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Data lists
  const [properties, setProperties] = useState<any[]>([]);
  const [rentCycles, setRentCycles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Loaders
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // Form states
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('1');
  const [newRoomRent, setNewRoomRent] = useState('');
  const [newRoomSecurityDeposit, setNewRoomSecurityDeposit] = useState('0');
  const [newRoomType, setNewRoomType] = useState<'ROOM' | 'HOUSE'>('ROOM');
  
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rentMonth, setRentMonth] = useState('2026-07');
  const [elecBill, setElecBill] = useState('0');
  const [waterBill, setWaterBill] = useState('0');
  const [motorBill, setMotorBill] = useState('0');
  const [secDepBill, setSecDepBill] = useState('0');
  const [internetBill, setInternetBill] = useState('0');
  const [cleaningBill, setCleaningBill] = useState('0');
  const [otherBill, setOtherBill] = useState('0');
  const [otherNotes, setOtherNotes] = useState('');
  const [customBills, setCustomBills] = useState<any[]>([]);
  const [dueDate, setDueDate] = useState('2026-07-25');
  
  const [announcementPropId, setAnnouncementPropId] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiQrFile, setUpiQrFile] = useState<File | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState('');
  
  const [complaintResolveId, setComplaintResolveId] = useState('');
  const [complaintResolveStatus, setComplaintResolveStatus] = useState('RESOLVED');
  const [complaintResolveNote, setComplaintResolveNote] = useState('');

  const [paymentRejectId, setPaymentRejectId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [copiedCode, setCopiedCode] = useState('');

  // Tenant edit states
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [editTenantId, setEditTenantId] = useState('');
  const [editTenantName, setEditTenantName] = useState('');
  const [editTenantEmail, setEditTenantEmail] = useState('');
  const [editTenantPhone, setEditTenantPhone] = useState('');

  // Profile edit states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch initial profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data.user.role !== 'OWNER') {
          router.replace('/dashboard/tenant');
        } else {
          setUser(data.user);
          setUpiId(data.user.ownerProfile?.upiId || '');
          setUpiName(data.user.ownerProfile?.upiName || '');
          setUpiQrUrl(data.user.ownerProfile?.upiQrCode || '');
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoadingUser(false));
  }, [router]);

  // Fetch dashboard data
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [propRes, rentRes, compRes, annRes, notifRes] = await Promise.all([
        fetch('/api/owner/properties'),
        fetch('/api/owner/rent'),
        fetch('/api/complaints'),
        fetch('/api/announcements'),
        fetch('/api/notifications')
      ]);

      const [propData, rentData, compData, annData, notifData] = await Promise.all([
        propRes.json(),
        rentRes.json(),
        compRes.json(),
        annRes.json(),
        notifRes.json()
      ]);

      setProperties(propData.properties || []);
      setRentCycles(rentData.rentCycles || []);
      setComplaints(compData.complaints || []);
      setAnnouncements(annData.announcements || []);
      setNotifications(notifData.notifications || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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
    // Refresh notifications list
    const notifRes = await fetch('/api/notifications');
    const notifData = await notifRes.json();
    setNotifications(notifData.notifications || []);
  };

  // 1. Create Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropAddress) return;
    
    try {
      const res = await fetch('/api/owner/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPropName, address: newPropAddress }),
      });
      if (res.ok) {
        setNewPropName('');
        setNewPropAddress('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !newRoomNumber || !newRoomRent) return;
    
    try {
      const res = await fetch('/api/owner/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          number: newRoomNumber,
          capacity: parseInt(newRoomCapacity),
          baseRent: parseFloat(newRoomRent),
          securityDeposit: parseFloat(newRoomSecurityDeposit || '0'),
          type: newRoomType,
        }),
      });
      if (res.ok) {
        setNewRoomNumber('');
        setNewRoomRent('');
        setNewRoomSecurityDeposit('0');
        setNewRoomType('ROOM');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Generate Rent Invoice
  const handleGenerateRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !rentMonth || !dueDate) return;

    try {
      const res = await fetch('/api/owner/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          billingMonth: rentMonth,
          electricity: parseFloat(elecBill || '0'),
          water: parseFloat(waterBill || '0'),
          motorCharge: parseFloat(motorBill || '0'),
          securityDeposit: parseFloat(secDepBill || '0'),
          internet: parseFloat(internetBill || '0'),
          cleaning: parseFloat(cleaningBill || '0'),
          otherBills: parseFloat(otherBill || '0'),
          otherBillsNotes: otherNotes,
          customCharges: customBills.filter(b => b.label && b.amount),
          dueDate: new Date(dueDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Rent invoice(s) generated successfully!');
        setSelectedRoomId('');
        setElecBill('0');
        setWaterBill('0');
        setMotorBill('0');
        setSecDepBill('0');
        setInternetBill('0');
        setCleaningBill('0');
        setOtherBill('0');
        setOtherNotes('');
        setCustomBills([]);
        fetchData();
      } else {
        alert(data.error || 'Failed to generate rent');
      }
    } catch (err) {
      console.error(err);
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

  // 9. Edit Tenant Details
  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenantId || !editTenantName || !editTenantEmail) return;

    try {
      const res = await fetch('/api/owner/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: editTenantId,
          name: editTenantName,
          email: editTenantEmail,
          phone: editTenantPhone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Tenant details updated successfully!');
        setShowEditTenantModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to update tenant details');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 10. QR code selection scanner
  const onQrCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUpiQrFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            console.log('Decoded QR Code:', code.data);
            try {
              const url = new URL(code.data);
              if (url.protocol === 'upi:') {
                const searchParams = new URLSearchParams(url.search);
                const pa = searchParams.get('pa'); // UPI ID
                const pn = searchParams.get('pn'); // UPI Name
                if (pa) {
                  setUpiId(pa);
                  alert(`Extracted UPI ID: ${pa}`);
                }
                if (pn) {
                  setUpiName(pn);
                }
              }
            } catch (err) {
              const parts = code.data.split('?');
              if (parts.length > 1) {
                const params = new URLSearchParams(parts[1]);
                const pa = params.get('pa');
                const pn = params.get('pn');
                if (pa) {
                  setUpiId(pa);
                  alert(`Extracted UPI ID: ${pa}`);
                }
                if (pn) {
                  setUpiName(pn);
                }
              }
            }
          }
        } catch (err) {
          console.error('QR Decode error:', err);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 4. Verify Payment Proof (Approve / Reject)
  const handleVerifyPayment = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason) {
      alert('Please enter a rejection reason.');
      return;
    }
    
    try {
      const res = await fetch('/api/owner/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });
      if (res.ok) {
        alert(`Payment ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        setPaymentRejectId('');
        setRejectionReason('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process payment verification');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Update UPI Details
  const handleUpdateUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !upiName) return;

    let finalQrUrl = upiQrUrl;

    if (upiQrFile) {
      const formData = new FormData();
      formData.append('file', upiQrFile);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          finalQrUrl = uploadData.url;
        } else {
          alert('Failed to upload QR Code image.');
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const res = await fetch('/api/owner/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId,
          upiName,
          upiQrCode: finalQrUrl,
        }),
      });
      if (res.ok) {
        alert('UPI details updated successfully!');
        setUpiQrFile(null);
        setUpiQrUrl(finalQrUrl);
        // Update user local state
        setUser((prev: any) => ({
          ...prev,
          ownerProfile: {
            ...prev.ownerProfile,
            upiId,
            upiName,
            upiQrCode: finalQrUrl
          }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Broadcast Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementPropId || !announcementTitle || !announcementContent) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: announcementPropId,
          title: announcementTitle,
          content: announcementContent,
        }),
      });
      if (res.ok) {
        alert('Announcement broadcasted successfully!');
        setAnnouncementTitle('');
        setAnnouncementContent('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Update Complaint Status
  const handleUpdateComplaintStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintResolveId || !complaintResolveStatus) return;

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaintResolveId,
          status: complaintResolveStatus,
          resolutionNote: complaintResolveNote,
        }),
      });
      if (res.ok) {
        alert('Complaint updated successfully!');
        setComplaintResolveId('');
        setComplaintResolveNote('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Regenerate Invite Code
  const handleRegenerateInvite = async (roomId: string) => {
    try {
      const res = await fetch('/api/owner/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        alert('Invite code regenerated!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Analytics Helpers
  const getOverviewStats = () => {
    let totalRentCollected = 0;
    let totalRentPending = 0;
    let outstandingBillsCount = 0;
    let pendingVerificationCount = 0;

    rentCycles.forEach((cycle) => {
      if (cycle.status === 'PAID') {
        totalRentCollected += cycle.totalAmount;
      } else if (cycle.status === 'UNDER_VERIFICATION') {
        totalRentPending += cycle.totalAmount;
        pendingVerificationCount++;
      } else {
        totalRentPending += cycle.totalAmount;
        outstandingBillsCount++;
      }
    });

    const activeTenantsCount = properties.reduce(
      (acc, prop) =>
        acc +
        prop.rooms.reduce((roomAcc: number, room: any) => roomAcc + room.tenants.length, 0),
      0
    );

    const vacantRoomsCount = properties.reduce(
      (acc, prop) =>
        acc +
        prop.rooms.reduce(
          (roomAcc: number, room: any) =>
            roomAcc + (room.tenants.length === 0 ? 1 : 0),
          0
        ),
      0
    );

    return {
      totalRentCollected,
      totalRentPending,
      outstandingBillsCount,
      pendingVerificationCount,
      activeTenantsCount,
      vacantRoomsCount,
    };
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading Owner cockpit...</p>
      </div>
    );
  }

  const stats = getOverviewStats();
  const allTenantsList = properties.flatMap((p: any) =>
    p.rooms.flatMap((r: any) =>
      r.tenants.map((t: any) => ({
        id: t.id,
        name: t.user.name,
        roomNumber: r.number,
        roomType: r.type,
        propertyName: p.name,
        email: t.user.email,
        phone: t.user.phone,
      }))
    )
  );

  const allOccupiedRooms = properties.flatMap((p: any) =>
    (p.rooms || [])
      .filter((r: any) => r.tenants && r.tenants.length > 0)
      .map((r: any) => ({
        id: r.id,
        number: r.number,
        type: r.type,
        propertyName: p.name,
        roommateCount: r.tenants.length,
        tenantsList: r.tenants.map((t: any) => t.user?.name || 'Occupant').join(', '),
      }))
  );

  const selectedRoom = allOccupiedRooms.find((r) => r.id === selectedRoomId);
  const roommateCount = selectedRoom ? selectedRoom.roommateCount : 1;

  const renderUnitCard = (room: any) => {
    return (
      <div key={room.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-white text-base">
            {room.type === 'HOUSE' ? `🏡 House ${room.number}` : `🚪 Room ${room.number}`}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
            room.tenants.length === 0 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            {room.tenants.length === 0 ? 'Vacant' : `Occupied (${room.tenants.length}/${room.capacity})`}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-zinc-400">
          {room.tenants.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-lg text-xs mb-1">
              <span className="text-purple-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Resident</span>
              <span className="text-white font-bold">{room.tenants.map((t: any) => t.user.name).join(', ')}</span>
            </div>
          )}
          <p className="flex justify-between">
            <span>Base Rent:</span>
            <span className="font-bold text-white">₹{room.baseRent.toLocaleString('en-IN')}/mo</span>
          </p>
          <p className="flex justify-between">
            <span>Capacity:</span>
            <span className="text-white">{room.capacity} sharing</span>
          </p>
        </div>

        {/* Invite code */}
        <div className="pt-3 border-t border-white/5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Join Invite Code</p>
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1.5 rounded-lg border border-zinc-800">
            <span className="text-xs font-mono font-bold text-purple-400 flex-1 truncate select-all">{room.inviteCode || 'N/A'}</span>
            <button
              onClick={() => copyToClipboard(room.inviteCode)}
              className="p-1 rounded text-zinc-550 hover:text-white transition-colors cursor-pointer"
              title="Copy Code"
            >
              {copiedCode === room.inviteCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => handleRegenerateInvite(room.id)}
              className="p-1 rounded text-zinc-550 hover:text-white transition-colors cursor-pointer"
              title="Regenerate Invite Code"
            >
              <TrendingUp className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>
        </div>

        {/* Tenants assigned with Edit details button */}
        {room.tenants.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Tenants Assigned</p>
            <div className="space-y-2">
              {room.tenants.map((t: any) => (
                <div key={t.id} className="text-xs text-white bg-white/5 p-2 rounded-xl flex items-center justify-between gap-2 border border-white/5">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.user.name}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{t.user.phone || 'No phone'}</p>
                  </div>
                  <Link
                    href={`/dashboard/owner/tenant/${t.id}`}
                    className="px-2.5 py-1.5 bg-purple-650/30 hover:bg-purple-600 hover:text-white text-purple-300 rounded text-[9px] font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1 border border-purple-550/20"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090b]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            RentEasy
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25 ml-auto">
            Host
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          
          <button
            onClick={() => setActiveTab('properties')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'properties'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-5 h-5" /> Properties & Rooms
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <Receipt className="w-5 h-5" /> Rent & Verifications
            </span>
            {stats.pendingVerificationCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black">
                {stats.pendingVerificationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" /> Complaints
            </span>
            {complaints.filter(c => c.status !== 'RESOLVED').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {complaints.filter(c => c.status !== 'RESOLVED').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-5 h-5" /> Announcements
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5" /> UPI Payment Settings
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">
              {activeTab === 'overview' && 'Cockpit Overview'}
              {activeTab === 'properties' && 'Properties & Rooms'}
              {activeTab === 'billing' && 'Rents & Verification'}
              {activeTab === 'complaints' && 'Maintenance Tickets'}
              {activeTab === 'announcements' && 'Broadcasting Center'}
              {activeTab === 'settings' && 'UPI Profile Setup'}
            </h1>
          </div>

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

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notifications</span>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-zinc-500 hover:text-white font-medium"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-white/5 text-xs">
                          <p className="font-semibold text-white mb-0.5">{n.title}</p>
                          <p className="text-zinc-400 leading-normal">{n.message}</p>
                          <span className="text-[9px] text-zinc-650 mt-1 block">
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
                <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-550/20 flex items-center justify-center text-purple-400 font-bold text-sm group-hover:bg-purple-500/20 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white hidden sm:inline">{user.name}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-6 overflow-y-auto relative">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Analytics Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Collected (This Month)
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-2">
                      ₹{stats.totalRentCollected.toLocaleString('en-IN')}
                    </h2>
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-4">
                    <TrendingUp className="w-3.5 h-3.5" /> Fully verified rents
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending / Verifying
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-2">
                      ₹{stats.totalRentPending.toLocaleString('en-IN')}
                    </h2>
                  </div>
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-4">
                    {stats.pendingVerificationCount} payments under review
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] pointer-events-none" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-400" /> Active Tenants
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-2">{stats.activeTenantsCount}</h2>
                  </div>
                  <p className="text-xs text-purple-400 mt-4">Occupying properties</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-[100px] pointer-events-none" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-pink-400" /> Vacant Rooms
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-2">{stats.vacantRoomsCount}</h2>
                  </div>
                  <p className="text-xs text-pink-400 mt-4">Available for invite</p>
                </div>
              </div>

              {/* Double Column Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Properties Quickview */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-400" /> Properties Summary
                    </h3>
                    <button
                      onClick={() => setActiveTab('properties')}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                    >
                      Manage
                    </button>
                  </div>
                  
                  {properties.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No properties added yet.</p>
                      <button
                        onClick={() => setActiveTab('properties')}
                        className="mt-3 text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-white font-semibold rounded-lg"
                      >
                        Create Property
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {properties.slice(0, 3).map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white">{p.name}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">{p.address}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-lg border border-purple-500/20 font-bold">
                              {p.rooms.length} Rooms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tenants Quickview */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-purple-400" /> Active Tenants ({allTenantsList.length})
                  </h3>
                  {allTenantsList.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-12">No tenants joined yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {allTenantsList.map((t) => (
                        <Link 
                          key={t.id} 
                          href={`/dashboard/owner/tenant/${t.id}`}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex justify-between items-center hover:bg-white/10 hover:border-purple-550/20 transition-all cursor-pointer block"
                        >
                          <div>
                            <p className="font-bold text-white">{t.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{t.propertyName} - Room {t.roomNumber} ({t.roomType})</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {t.phone || 'No phone'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROPERTIES & ROOMS */}
          {activeTab === 'properties' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Property Form */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" /> Add Property
                  </h3>
                  <form onSubmit={handleCreateProperty} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Property Name</label>
                      <input
                        type="text"
                        required
                        value={newPropName}
                        onChange={(e) => setNewPropName(e.target.value)}
                        placeholder="e.g. Greenwood PG, Silver Oak Apartments"
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Address</label>
                      <input
                        type="text"
                        required
                        value={newPropAddress}
                        onChange={(e) => setNewPropAddress(e.target.value)}
                        placeholder="e.g. Sector 62, Noida, UP"
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="glow-btn px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Save Property
                    </button>
                  </form>
                </div>

                {/* Create Room Form */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-500" /> Add Room to Property
                  </h3>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Property</label>
                      <select
                        required
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                      >
                        <option value="">-- Choose Property --</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                          {newRoomType === 'HOUSE' ? 'House Number / ID' : 'Room Number / ID'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newRoomNumber}
                          onChange={(e) => setNewRoomNumber(e.target.value)}
                          placeholder={newRoomType === 'HOUSE' ? 'e.g. A-302, Villa 4' : 'e.g. 101, B-4'}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                          {newRoomType === 'HOUSE' ? 'Monthly Rent (₹)' : 'Base Rent (Monthly)'}
                        </label>
                        <input
                          type="number"
                          required
                          value={newRoomRent}
                          onChange={(e) => setNewRoomRent(e.target.value)}
                          placeholder="₹ e.g. 8000"
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                    </div>

                    {newRoomType === 'HOUSE' && (
                      <div className="animate-fade-in-up">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Security Deposit (₹)</label>
                        <input
                          type="number"
                          required
                          value={newRoomSecurityDeposit}
                          onChange={(e) => setNewRoomSecurityDeposit(e.target.value)}
                          placeholder="₹ e.g. 20000"
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-550 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-450 mb-2">Unit Type</label>
                      <div className="relative flex p-1 bg-zinc-950 rounded-xl border border-zinc-800 w-full mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setNewRoomType('ROOM');
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            newRoomType === 'ROOM'
                              ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          🚪 Room Rent (Shared PG)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewRoomType('HOUSE');
                            setNewRoomCapacity('1');
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            newRoomType === 'HOUSE'
                              ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          🏡 House Rent (Entire Unit)
                        </button>
                      </div>
                    </div>

                    {newRoomType === 'ROOM' && (
                      <div className="animate-fade-in-up">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Max Sharing Capacity</label>
                        <select
                          value={newRoomCapacity}
                          onChange={(e) => setNewRoomCapacity(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                        >
                          <option value="1">1 Person (Private Room)</option>
                          <option value="2">2 Persons Sharing</option>
                          <option value="3">3 Persons Sharing</option>
                          <option value="4">4 Persons Sharing</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="glow-btn px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Save Room
                    </button>
                  </form>
                </div>
              </div>

              {/* Properties and Rooms Tree */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" /> Active Properties Layout
                </h3>

                {properties.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">No properties defined yet. Complete the form above to start.</p>
                ) : (
                  properties.map((p) => (
                    <div key={p.id} className="glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
                        <div>
                          <h4 className="text-xl font-bold text-white">{p.name}</h4>
                          <p className="text-xs text-zinc-400">{p.address}</p>
                        </div>
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 font-bold self-start">
                          {p.rooms.length} Rooms Total
                        </span>
                      </div>

                      {p.rooms.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-2">No units added to this property yet.</p>
                      ) : (
                        <div className="space-y-6">
                          {/* 1. ROOMS SECTION */}
                          {p.rooms.filter((r: any) => r.type === 'ROOM').length > 0 && (
                            <div className="space-y-3">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                🚪 Rooms List ({p.rooms.filter((r: any) => r.type === 'ROOM').length})
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {p.rooms.filter((r: any) => r.type === 'ROOM').map((room: any) => renderUnitCard(room))}
                              </div>
                            </div>
                          )}

                          {/* 2. HOUSES SECTION */}
                          {p.rooms.filter((r: any) => r.type === 'HOUSE').length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-white/5">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                🏡 Houses List ({p.rooms.filter((r: any) => r.type === 'HOUSE').length})
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {p.rooms.filter((r: any) => r.type === 'HOUSE').map((room: any) => renderUnitCard(room))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RENT & VERIFICATIONS */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-fade-in-up">
                
                {/* Double Column forms/queues */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Generate Rent Invoice */}
                  <div className="glass-panel p-6 rounded-2xl lg:col-span-1 h-fit">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-purple-500" /> Generate Rent Bill
                    </h3>
                    <form onSubmit={handleGenerateRent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Occupied Room / House</label>
                        <select
                          required
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-550 text-sm cursor-pointer"
                        >
                          <option value="">-- Choose Room/House --</option>
                          {allOccupiedRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.type === 'HOUSE' ? '🏡' : '🚪'} {r.propertyName} - Room {r.number} ({r.roommateCount} residents)
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedRoom && (
                        <div className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-550/20 p-3 rounded-xl animate-fade-in-up leading-relaxed space-y-1">
                          <p className="font-bold flex items-center gap-1">👤 Active Residents:</p>
                          <p className="text-white font-semibold">{selectedRoom.tenantsList}</p>
                          {selectedRoom.type === 'ROOM' && selectedRoom.roommateCount > 1 && (
                            <p className="mt-1.5 text-zinc-450 text-[10px]">
                              Utility bills entered below will be divided by {selectedRoom.roommateCount} roommates automatically on submission.
                            </p>
                          )}
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Billing Month</label>
                        <input
                          type="month"
                          required
                          value={rentMonth}
                          onChange={(e) => setRentMonth(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Due Date</label>
                        <input
                          type="date"
                          required
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <p className="text-xs font-bold text-zinc-400">Additional Utilities (₹)</p>
                      
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">Electricity Bill (Total)</label>
                        <input
                          type="number"
                          value={elecBill}
                          onChange={(e) => setElecBill(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                        />
                      </div>

                      {/* HOUSE-specific fields: Security Deposit, Water, Motor */}
                      {selectedRoom?.type === 'HOUSE' && (
                        <div className="space-y-3 animate-fade-in-up">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-zinc-500 mb-1">Security Deposit</label>
                              <input
                                type="number"
                                value={secDepBill}
                                onChange={(e) => setSecDepBill(e.target.value)}
                                className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-500 mb-1">Water Bill</label>
                              <input
                                type="number"
                                value={waterBill}
                                onChange={(e) => setWaterBill(e.target.value)}
                                className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
                              💧 Motor Charge
                            </label>
                            <input
                              type="number"
                              value={motorBill}
                              onChange={(e) => setMotorBill(e.target.value)}
                              className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* ROOM-specific fields: Internet, Cleaning */}
                      {selectedRoom?.type === 'ROOM' && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Internet Charge</label>
                            <input
                              type="number"
                              value={internetBill}
                              onChange={(e) => setInternetBill(e.target.value)}
                              className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Cleaning Charge</label>
                            <input
                              type="number"
                              value={cleaningBill}
                              onChange={(e) => setCleaningBill(e.target.value)}
                              className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Other Utility (Wi-Fi, etc)</label>
                          <input
                            type="number"
                            value={otherBill}
                            onChange={(e) => setOtherBill(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Utility Notes</label>
                          <input
                            type="text"
                            value={otherNotes}
                            onChange={(e) => setOtherNotes(e.target.value)}
                            placeholder="e.g. WiFi Charge"
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>

                      {/* Custom Dynamic Charges */}
                      {customBills.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Owner Custom Charges</p>
                          {customBills.map((bill, index) => (
                            <div key={index} className="grid grid-cols-2 gap-3 items-center bg-white/5 p-2 rounded-xl border border-white/5 animate-fade-in-up">
                              <div>
                                <input
                                  type="text"
                                  required
                                  value={bill.label}
                                  onChange={(e) => {
                                    const updated = [...customBills];
                                    updated[index].label = e.target.value;
                                    setCustomBills(updated);
                                  }}
                                  placeholder="e.g. Parking, Pest"
                                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  required
                                  value={bill.amount}
                                  onChange={(e) => {
                                    const updated = [...customBills];
                                    updated[index].amount = e.target.value;
                                    setCustomBills(updated);
                                  }}
                                  placeholder="Amount"
                                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = customBills.filter((_, i) => i !== index);
                                    setCustomBills(updated);
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-450 cursor-pointer"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {customBills.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomBills([...customBills, { label: '', amount: '0' }]);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer w-fit mt-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Custom Charge
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Create Bill Invoice
                    </button>
                  </form>
                </div>

                {/* Verification Queue (Under Review payments) */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" /> Payment Proof Verification Queue
                  </h3>

                  {rentCycles.filter((rc) => rc.status === 'UNDER_VERIFICATION').length === 0 ? (
                    <div className="text-center py-16 text-zinc-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-30" />
                      <p className="text-sm">Verification queue is empty. All payments verified!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {rentCycles
                        .filter((rc) => rc.status === 'UNDER_VERIFICATION')
                        .map((rc) => {
                          const activePayment = rc.payments.find((p: any) => p.status === 'PENDING');
                          if (!activePayment) return null;

                          return (
                            <div key={rc.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4 text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                                <div>
                                  <h4 className="font-bold text-white">{rc.tenant.user.name}</h4>
                                  <p className="text-xs text-zinc-400">
                                    Room {rc.tenant.room.number} ({rc.tenant.room.property.name}) • Month: {rc.billingMonth}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-bold text-purple-400">₹{rc.totalAmount.toLocaleString('en-IN')}</p>
                                  <span className="text-[10px] uppercase font-bold text-amber-400">Verifying Proof</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-xs">
                                    <span className="text-zinc-500 block">Transaction Reference / UTR ID:</span>
                                    <span className="font-mono text-white font-bold">{activePayment.transactionId}</span>
                                  </p>
                                  <p className="text-xs">
                                    <span className="text-zinc-500 block">Uploaded At:</span>
                                    <span className="text-white">{new Date(activePayment.paidAt).toLocaleString('en-IN')}</span>
                                  </p>

                                  {/* Action form */}
                                  <div className="pt-3 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleVerifyPayment(activePayment.id, 'APPROVE')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer"
                                      >
                                        <Check className="w-4 h-4" /> Approve Payment
                                      </button>
                                      <button
                                        onClick={() => setPaymentRejectId(activePayment.id)}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/10 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" /> Reject Payment
                                      </button>
                                    </div>

                                    {paymentRejectId === activePayment.id && (
                                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                                        <input
                                          type="text"
                                          required
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Enter reason for rejection..."
                                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-white text-xs"
                                        />
                                        <div className="flex items-center gap-2 justify-end">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPaymentRejectId('');
                                              setRejectionReason('');
                                            }}
                                            className="text-[10px] text-zinc-400 hover:text-white"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleVerifyPayment(activePayment.id, 'REJECT')}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-semibold cursor-pointer"
                                          >
                                            Confirm Reject
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-zinc-550 text-xs block mb-1">Receipt Screenshot:</span>
                                  {activePayment.screenshotUrl ? (
                                    <div className="relative rounded-lg overflow-hidden border border-white/5 max-h-36 bg-zinc-950 flex items-center justify-center">
                                      {/* Link to open in new tab */}
                                      <a
                                        href={activePayment.screenshotUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold text-white"
                                      >
                                        <Eye className="w-5 h-5 mr-1" /> Open Image
                                      </a>
                                      <img
                                        src={activePayment.screenshotUrl}
                                        alt="Proof"
                                        className="object-contain max-h-36 w-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-zinc-600 text-xs">
                                      No screenshot uploaded
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
              </div>

              {/* Rents Ledger list */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" /> Invoices & Bills Registry
                </h3>

                {rentCycles.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">No rent bills generated yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-400 text-xs uppercase font-semibold">
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Property/Room</th>
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rentCycles.map((rc) => (
                          <tr key={rc.id} className="text-zinc-300 hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{rc.tenant.user.name}</td>
                            <td className="py-3.5 px-4">
                              {rc.tenant.room.property.name} - Room {rc.tenant.room.number}
                            </td>
                            <td className="py-3.5 px-4 font-mono">{rc.billingMonth}</td>
                            <td className="py-3.5 px-4 font-semibold text-white">₹{rc.totalAmount.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                                rc.status === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : rc.status === 'UNDER_VERIFICATION'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {rc.status === 'UNDER_VERIFICATION' ? 'VERIFYING' : rc.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono">
                              {new Date(rc.dueDate).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              {rc.status === 'PAID' ? (
                                <Link
                                  href={`/receipt/${rc.id}`}
                                  target="_blank"
                                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" /> View Receipt
                                </Link>
                              ) : (
                                <Link
                                  href={`/dashboard/owner/tenant/${rc.tenant.id}`}
                                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/5 font-bold transition-all"
                                >
                                  Manage & Edit
                                </Link>
                              )}
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

          {/* TAB 4: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resolve Note Form */}
                <div className="glass-panel p-6 rounded-2xl h-fit">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500" /> Resolve Ticket
                  </h3>
                  <form onSubmit={handleUpdateComplaintStatus} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Complaint Ticket</label>
                      <select
                        required
                        value={complaintResolveId}
                        onChange={(e) => setComplaintResolveId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                      >
                        <option value="">-- Choose Ticket --</option>
                        {complaints
                          .filter((c) => c.status !== 'RESOLVED')
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} (Room {c.tenant.room?.number || 'N/A'} - {c.tenant.user.name})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Update Status</label>
                      <select
                        required
                        value={complaintResolveStatus}
                        onChange={(e) => setComplaintResolveStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                      >
                        <option value="RESOLVED">RESOLVED (Issue Fixed)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Working on it)</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Landlord Note / Action Taken</label>
                      <textarea
                        value={complaintResolveNote}
                        onChange={(e) => setComplaintResolveNote(e.target.value)}
                        placeholder="Explain resolution (e.g. Plumber dispatched, fixed tap)"
                        rows={3}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="glow-btn w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Update Ticket Status
                    </button>
                  </form>
                </div>

                {/* Complaints list */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <AlertTriangle className="w-5 h-5 text-purple-400" /> Maintenance Tickets Registry
                  </h3>

                  {complaints.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-12 text-center">No maintenance complaints filed yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {complaints.map((c) => (
                        <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 border ${
                                c.urgency === 'HIGH'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : c.urgency === 'MEDIUM'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {c.urgency} Urgency
                              </span>
                              <span className="text-zinc-500 text-xs font-medium">Category: {c.category}</span>
                              <h4 className="font-bold text-white text-base mt-2">{c.title}</h4>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border self-start ${
                              c.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : c.status === 'IN_PROGRESS'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {c.status}
                            </span>
                          </div>

                          <p className="text-zinc-350 text-sm leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                            {c.description}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 gap-2">
                            <p>
                              Filed by: <span className="font-bold text-zinc-300">{c.tenant.user.name}</span> (Room {c.tenant.room?.number || 'N/A'}, {c.tenant.room?.property?.name || 'N/A'})
                            </p>
                            <p>Filed At: {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>

                          {c.resolutionNote && (
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-450">
                              <p className="font-bold">Resolution Note:</p>
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

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Broadcast Form */}
                <div className="glass-panel p-6 rounded-2xl h-fit">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-500" /> Broadcast Announcement
                  </h3>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Target Property</label>
                      <select
                        required
                        value={announcementPropId}
                        onChange={(e) => setAnnouncementPropId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                      >
                        <option value="">-- Choose Property --</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Announcement Title</label>
                      <input
                        type="text"
                        required
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g. Lift Maintenance, Pest Control Schedule"
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Broadcast Message</label>
                      <textarea
                        required
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        placeholder="Write detailed announcement..."
                        rows={5}
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Megaphone className="w-4 h-4" /> Broadcast Announcement
                    </button>
                  </form>
                </div>

                {/* Announcement history */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <Megaphone className="w-5 h-5 text-purple-400" /> Announcements History
                  </h3>

                  {announcements.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-12 text-center">No announcements broadcasted yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {announcements.map((a) => (
                        <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-550/10 px-2 py-0.5 rounded border border-purple-500/20">
                                {a.property.name}
                              </span>
                              <h4 className="font-bold text-white text-base mt-2">{a.title}</h4>
                            </div>
                            <span className="text-[10px] text-zinc-550 font-mono">
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
            </div>
          )}

          {/* TAB 6: UPI SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                  <Settings className="w-5 h-5 text-purple-500" /> UPI Payment Settings
                </h3>

                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  These payment details will be displayed to your tenants during checkout. Correct configuration ensures tenants can pay you directly using UPI Intent (GPay, PhonePe, Paytm, etc.) or QR scan.
                </p>

                <form onSubmit={handleUpdateUpi} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">UPI ID (VPA)</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. rajeshkumar@okaxis"
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">UPI Display Name (Account Holder)</label>
                      <input
                        type="text"
                        required
                        value={upiName}
                        onChange={(e) => setUpiName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">UPI Payment QR Image</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onQrCodeFileChange}
                          className="text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-500">Upload your static UPI merchant QR screenshot (PNG/JPEG)</span>
                      </div>
                      
                      {upiQrUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-white/5 h-28 w-28 bg-zinc-950 flex items-center justify-center mx-auto md:ml-auto">
                          <img
                            src={upiQrUrl}
                            alt="UPI QR Code"
                            className="object-contain max-h-28 w-full"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-28 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-center text-zinc-650 text-[10px] mx-auto md:ml-auto">
                          No QR Code uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="glow-btn px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    Save Payment Configuration
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Edit Tenant Profile Modal */}
      {showEditTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowEditTenantModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" /> Edit Tenant Profile
            </h3>
            
            <form onSubmit={handleEditTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Tenant Full Name</label>
                <input
                  type="text"
                  required
                  value={editTenantName}
                  onChange={(e) => setEditTenantName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editTenantEmail}
                  onChange={(e) => setEditTenantEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editTenantPhone}
                  onChange={(e) => setEditTenantPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="glow-btn w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm mt-2 transition-colors cursor-pointer"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}

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

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        if (data.user.role === 'OWNER') {
          router.replace('/dashboard/owner');
        } else {
          router.replace('/dashboard/tenant');
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
      <p className="text-zinc-400 text-sm">Verifying session...</p>
    </div>
  );
}

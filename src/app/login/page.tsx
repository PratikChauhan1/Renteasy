'use client';

import { Suspense } from 'react';
import AuthSlider from '@/components/AuthSlider';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#dbeafe] to-[#e0e7ff]">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthSlider initialMode="signin" />
    </Suspense>
  );
}

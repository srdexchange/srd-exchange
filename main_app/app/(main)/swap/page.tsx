'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import SimpleNav from '@/components/simple-nav';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with wallet hooks
const RangoSwapWidget = dynamic(() => import('@/components/RangoSwapWidget'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[480px] h-[600px] bg-[#111] border border-white/5 rounded-3xl animate-pulse" />
    </div>
  ),
});

export default function SwapPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="bg-black min-h-screen">
        <SimpleNav />
        <main className="max-w-7xl mx-auto px-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <RangoSwapWidget />
        </main>
      </div>
    </AuthGuard>
  );
}

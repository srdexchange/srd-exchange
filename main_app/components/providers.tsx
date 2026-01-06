'use client';

// CRITICAL: Import polyfills BEFORE any Particle imports
import '@/lib/particlePolyfills';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParticleConnectkit } from '@/lib/connectkit';
import FontProvider from './FontProvider';
import { ReactNode, useMemo } from 'react';

// Create QueryClient outside component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ParticleConnectkit>
      <QueryClientProvider client={queryClient}>
        <FontProvider />
        <div className="font-montserrat">
          {children}
        </div>
      </QueryClientProvider>
    </ParticleConnectkit>
  );
}
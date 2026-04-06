'use client';

// CRITICAL: Import polyfills BEFORE any Particle imports
import '@/lib/particlePolyfills';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParticleConnectkit } from '@/lib/connectkit';
import { useAccount } from '@particle-network/connectkit';
import { particleAuth } from '@particle-network/auth-core';
import FontProvider from './FontProvider';
import { ReactNode, useEffect, useState } from 'react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import RightSidebar from './RightSidebar';
import { useWalletManager } from '@/hooks/useWalletManager';

// Create QueryClient outside component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function SidebarWrapper({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { walletData, refetchBalances } = useWalletManager();
  const { isConnected } = useAccount();
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  // Refetch balances when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      refetchBalances();
    }
  }, [isSidebarOpen, refetchBalances]);

  // Fetch Solana address once connected
  useEffect(() => {
    if (!isConnected) return;

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    Promise.race([particleAuth.solana.connect(), timeout])
      .then(async () => {
        try {
          const pubKey = await particleAuth.solana.publicKey();
          if (pubKey) setSolanaAddress(pubKey.toBase58());
        } catch {
          const addr = particleAuth.solana.selectedAddress;
          if (addr) setSolanaAddress(addr);
        }
      })
      .catch(() => {});
  }, [isConnected]);

  // Always use smart wallet address - no EOA fallback
  const smartAddress = walletData?.smartWallet?.address;
  const displayUsdtBalance = walletData?.smartWallet?.usdtBalance || "0";

  // Wait for smart wallet address to be computed
  if (isSidebarOpen && !smartAddress) {
    return (
      <>
        {children}
        <RightSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          smartWalletAddress={smartAddress}
          solanaAddress={solanaAddress}
          userBalances={null}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <RightSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        smartWalletAddress={smartAddress}
        solanaAddress={solanaAddress}
        userBalances={{
          usdt: displayUsdtBalance,
          inr: "0"
        }}
      />
    </>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ParticleConnectkit>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <FontProvider />
          <div className="font-montserrat">
            <SidebarWrapper>
              {children}
            </SidebarWrapper>
          </div>
        </SidebarProvider>
      </QueryClientProvider>
    </ParticleConnectkit>
  );
}
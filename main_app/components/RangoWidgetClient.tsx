'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from '@particle-network/connectkit';

const Widget = dynamic(
  () => import('@rango-dev/widget-embedded').then((mod) => mod.Widget),
  { ssr: false }
);

const SUPPORTED_CHAINS = ['ETH', 'BSC', 'BASE', 'ARBITRUM', 'OPTIMISM', 'POLYGON', 'CRONOS', 'AVAX', 'SCROLL'];

export default function RangoWidgetClient() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const apiKey = process.env.NEXT_PUBLIC_RANGO_API_KEY || '';
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

  // Pre-fill destination with platform EOA for all chains
  const defaultCustomDestinations: Record<string, string> = {};
  if (isConnected && address) {
    SUPPORTED_CHAINS.forEach((chain) => {
      defaultCustomDestinations[chain] = address;
    });
  }

  return (
    <Widget config={{
      apiKey,
      walletConnectProjectId,
      // Particle sets window.ethereum for ALL login types (email/phone/social/MetaMask)
      // Rango's MetaMask connector reads window.ethereum → auto-connects to Particle EOA
      wallets: ['metamask'],
      from: { blockchains: SUPPORTED_CHAINS },
      to: { blockchains: SUPPORTED_CHAINS },
      customDestination: true,
      defaultCustomDestinations: Object.keys(defaultCustomDestinations).length > 0 ? defaultCustomDestinations : undefined,
      theme: { mode: 'dark', singleTheme: true },
    }} />
  );
}

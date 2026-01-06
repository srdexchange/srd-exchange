'use client';

import './particlePolyfills';

import { ConnectKitProvider, createConfig } from '@particle-network/connectkit';
import { authWalletConnectors } from '@particle-network/connectkit/auth';
import { bsc } from '@particle-network/connectkit/chains';
import { evmWalletConnectors } from '@particle-network/connectkit/evm';
import { wallet, EntryPosition } from '@particle-network/connectkit/wallet';
import React from 'react';
import { particleAuth } from '@particle-network/auth-core';

// Retrieve environment variables
let projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
let clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
let appId = process.env.NEXT_PUBLIC_APP_ID as string;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

// Validate environment variables
if (!projectId || !clientKey || !appId) {
  console.warn('⚠️  Particle Network configuration missing!');
  console.warn('Please set the following environment variables in .env.local:');
  console.warn('- NEXT_PUBLIC_PROJECT_ID');
  console.warn('- NEXT_PUBLIC_CLIENT_KEY');
  console.warn('- NEXT_PUBLIC_APP_ID');
  console.warn('Get these values from: https://dashboard.particle.network');
  console.warn('Using fallback configuration for development...');

  // Fallback values for development
  projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
  clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
  appId = process.env.NEXT_PUBLIC_APP_ID as string;
}

// IMPORTANT: Create config outside component to prevent re-initialization
let authCoreInitialized = false;

function ensureAuthCoreInitialized() {
  if (authCoreInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    // AuthCore powers social/email login and its storage helper must be
    // initialized before ConnectKit touches it. Without this, calls like
    // getLatestAuthType throw "please init AuthCore first!"
    particleAuth.init({
      projectId,
      clientKey,
      appId,
    });
    authCoreInitialized = true;
  } catch (error) {
    console.error('AuthCore failed to initialize', error);
  }
}

const config = createConfig({
  projectId,
  clientKey,
  appId,
  chains: [bsc],
  appearance: {
    recommendedWallets: [
      { walletId: 'metaMask', label: 'Recommended' },
      { walletId: 'coinbaseWallet', label: 'popular' },
    ],
    splitEmailAndPhone: false,
    collapseWalletList: false,
    hideContinueButton: false,
    connectorsOrder: ['email', 'phone', 'social', 'wallet'],
    language: 'en-US',
    mode: 'light',
    theme: {
      '--pcm-accent-color': '#7c3aed',
    },
  },
  walletConnectors: [
    evmWalletConnectors({
      metadata: {
        name: 'SRD Exchange',
        icon: '',
        description: 'P2P USDT Trading Platform',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      },
      walletConnectProjectId: walletConnectProjectId,
    }),
    authWalletConnectors({
      authTypes: ['email', 'google', 'apple', 'twitter', 'github'],
      fiatCoin: 'USD',
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 1,
        promptPaymentPasswordSettingWhenSign: 1,
      },
    }),
  ],
  plugins: [
    wallet({
      entryPosition: EntryPosition.BR,
      visible: true,
    }),
  ],
});

// Use a singleton pattern to prevent multiple initializations
let isInitialized = false;

export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  // Ensure AuthCore is ready on first render (needed before ConnectKit hooks run)
  ensureAuthCoreInitialized();

  // Prevent multiple initializations in development mode
  React.useEffect(() => {
    if (isInitialized) {
      console.warn('ParticleConnectkit already initialized');
    }
    isInitialized = true;

    return () => {
      // Don't reset on cleanup in production
      if (process.env.NODE_ENV === 'development') {
        isInitialized = false;
      }
    };
  }, []);

  try {
    return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
  } catch (error) {
    console.error('Failed to initialize Particle Connect:', error);
    console.warn('Falling back to basic provider without wallet integration...');
    return <div>{children}</div>;
  }
};

export { config };
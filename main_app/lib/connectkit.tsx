'use client';

import { ConnectKitProvider, createConfig } from '@particle-network/connectkit';
import { authWalletConnectors } from '@particle-network/connectkit/auth';
import { bsc } from '@particle-network/connectkit/chains';
import { evmWalletConnectors } from '@particle-network/connectkit/evm';
import { wallet, EntryPosition } from '@particle-network/connectkit/wallet';
import React from 'react';

// Retrieved from https://dashboard.particle.network
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_APP_ID as string;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

// Check if required environment variables are set
if (!projectId || !clientKey || !appId) {
    console.warn('⚠️  Particle Network configuration missing!');
    console.warn('Please set the following environment variables in .env.local:');
    console.warn('- NEXT_PUBLIC_PROJECT_ID');
    console.warn('- NEXT_PUBLIC_CLIENT_KEY');
    console.warn('- NEXT_PUBLIC_APP_ID');
    console.warn('');
    console.warn('Get these values from: https://dashboard.particle.network');
    console.warn('Using fallback configuration for development...');

    // Use placeholder values for development
    const projectId = 'placeholder-project-id';
    const clientKey = 'placeholder-client-key';
    const appId = 'placeholder-app-id';
}

const config = createConfig({
    projectId,
    clientKey,
    appId,
    chains: [bsc],
    appearance: {
        // Optional, collection of properties to alter the appearance of the connection modal
        // Optional, label and sort wallets (to be shown in the connection modal)
        recommendedWallets: [
            { walletId: 'metaMask', label: 'Recommended' },
            { walletId: 'coinbaseWallet', label: 'popular' },
        ],
        splitEmailAndPhone: false, // Optional, displays Email and phone number entry separately
        collapseWalletList: false, // Optional, hide wallet list behind a button
        hideContinueButton: false, // Optional, remove "Continue" button underneath Email or phone number entry
        connectorsOrder: ['email', 'phone', 'social', 'wallet'], //  Optional, sort connection methods (index 0 will be placed at the top)
        language: 'en-US', // Optional, also supported ja-JP, zh-CN, zh-TW, and ko-KR
        mode: 'light', // Optional, changes theme between light, dark, or auto (which will change it based on system settings)
        theme: {
            '--pcm-accent-color': '#7c3aed', // Purple color to match the app theme
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
            walletConnectProjectId: walletConnectProjectId, // optional, retrieved from https://cloud.walletconnect.com
        }),
        authWalletConnectors({
            // Optional, configure this if you're using social logins
            authTypes: ['email', 'google', 'apple', 'twitter', 'github'], // Optional, restricts the types of social logins supported
            fiatCoin: 'USD', // Optional, also supports CNY, JPY, HKD, INR, and KRW
            promptSettingConfig: {
                // Optional, changes the frequency in which the user is asked to set a master or payment password
                // 0 = Never ask
                // 1 = Ask once
                // 2 = Ask always, upon every entry
                // 3 = Force the user to set this password
                promptMasterPasswordSettingWhenLogin: 1,
                promptPaymentPasswordSettingWhenSign: 1,
            },
        }),
    ],
    plugins: [
        wallet({
            // Optional configurations for the attached embedded wallet modal
            entryPosition: EntryPosition.BR, // Alters the position in which the modal button appears upon login
            visible: true,
        }),
    ],
});

// Export ConnectKitProvider to be used within your index or layout file
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
    try {
        return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
    } catch (error) {
        console.error('Failed to initialize Particle Connect:', error);
        console.warn('Falling back to basic provider without wallet integration...');
        return <div>{children}</div>;
    }
};

export { config };


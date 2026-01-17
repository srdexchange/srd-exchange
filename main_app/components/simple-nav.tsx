'use client'

import Image from 'next/image'
import { CircleUser } from 'lucide-react'
import { useWalletManager } from '@/hooks/useWalletManager'
import { useState } from 'react'
import RightSidebar from './RightSidebar'

export default function SimpleNav() {
  const [bnbEnabled, setBnbEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    address,
    isConnected,
    walletData,
    isLoading: walletLoading,
    approveUSDT,
  } = useWalletManager();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };
  return (
    <nav className="w-full bg-black border-b border-gray-800 text-white px-3 py-2">
      <div className="flex items-center justify-between w-full">
        {/* Logo Section - Left */}
        <div className="flex items-center space-x-2">
          <Image
            src="/srd_final.svg"
            alt="SRD Exchange Logo"
            width={10}
            height={10}
            className="w-20 h-20 object-contain"
          />
          <span className="text-xl font-bold  tracking-tight hidden md:flex md:flex-row">
            SRD Exchange
          </span>
        </div>

        {/* Right Section - Social Icons and Help */}
        <div className="flex items-center space-x-6">
          {/* BNB Toggle */}
          <button
            onClick={() => setBnbEnabled(!bnbEnabled)}
            className={`w-12 h-8 rounded-2xl flex items-center justify-center border transition
      ${bnbEnabled
                ? "bg-yellow-400/20 border-yellow-400"
                : "bg-white/10 border-white/20 hover:bg-white/20"}
    `}
          >
            <img
              src="/bsc-wallet.svg" // place BNB icon in public folder
              alt="BNB"
              className={`w-6 h-6 transition ${bnbEnabled ? "opacity-100" : "opacity-50"
                }`}
            />
          </button>

          {/* User Section - Clickable to open Sidebar */}
          <div
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 flex items-center justify-center">
              <CircleUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <div className="flex flex-col items-start">
              <span className="text-xs sm:text-sm text-white font-medium">
                {walletData?.smartWallet?.address
                  ? `${walletData.smartWallet.address.slice(0, 6)}...${walletData.smartWallet.address.slice(-4)}`
                  : address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connect Wallet"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <RightSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        address={walletData?.smartWallet?.address || address}
        userBalances={{
          usdt: walletData?.smartWallet?.usdtBalance || "0",
          inr: "0"
        }}
      />
    </nav>
  )
}
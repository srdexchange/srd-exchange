'use client'
import { useAccount, useDisconnect, useModal, ConnectButton } from '@particle-network/connectkit'

export default function WalletConnect() {
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()
  const { setOpen } = useModal()

  if (isConnected) {
    return (
      <div className="bg-green-100 p-4 rounded-lg">
        <p className="text-green-800 font-medium">Connected</p>
        <p className="text-sm text-gray-600">{address}</p>
        <button 
          onClick={() => disconnect()}
          className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Connect Your Wallet</h3>
      <ConnectButton />
    </div>
  )
}

import { useWalletManager } from './useWalletManager'
import { useState } from 'react'

export function useAdminContract() {
  const { 
    verifyPaymentOnChain, 
    completeBuyOrderOnChain, 
    completeSellOrderOnChain,
    isPending,
    isConfirming,
    hash
  } = useWalletManager()
  
  const [lastAction, setLastAction] = useState<string | null>(null)

  const handleVerifyPayment = async (orderId: number) => {
    try {
      setLastAction('verifying')
      console.log('🔗 Verifying payment on blockchain for order:', orderId)
      await verifyPaymentOnChain(orderId)
      return true
    } catch (error) {
      console.error('❌ Error verifying payment on blockchain:', error)
      setLastAction(null)
      throw error
    }
  }

  const handleCompleteBuyOrder = async (orderId: number) => {
    try {
      setLastAction('completing_buy')
      console.log('🔗 Completing buy order on blockchain for order:', orderId)
      await completeBuyOrderOnChain(orderId)
      return true
    } catch (error) {
      console.error('❌ Error completing buy order on blockchain:', error)
      setLastAction(null)
      throw error
    }
  }

  const handleCompleteSellOrder = async (orderId: number) => {
    try {
      setLastAction('completing_sell')
      console.log('🔗 Completing sell order on blockchain for order:', orderId)
      await completeSellOrderOnChain(orderId)
      return true
    } catch (error) {
      console.error('❌ Error completing sell order on blockchain:', error)
      setLastAction(null)
      throw error
    }
  }

  return {
    handleVerifyPayment,
    handleCompleteBuyOrder,
    handleCompleteSellOrder,
    isTransacting: isPending || isConfirming,
    lastAction,
    hash
  }
}
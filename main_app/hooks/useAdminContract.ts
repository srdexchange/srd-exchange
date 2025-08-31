import { useState } from 'react'
import { useWalletManager } from './useWalletManager'

export function useAdminContract() {
  const [isTransacting, setIsTransacting] = useState(false)
  const [lastAction, setLastAction] = useState<'verifying' | 'completing_buy' | 'completing_sell' | 'approving' | 'creating_buy' | null>(null)
  
  const { 
    verifyPaymentOnChain, 
    completeBuyOrderOnChain, 
    completeSellOrderOnChain,
    approveOrderOnChain,
    createBuyOrderOnChain,
    hash 
  } = useWalletManager()

  const handleVerifyPayment = async (orderId: number) => {
    try {
      setIsTransacting(true)
      setLastAction('verifying')
      await verifyPaymentOnChain(orderId)
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    } finally {
      setIsTransacting(false)
      setLastAction(null)
    }
  }

  const handleCompleteBuyOrder = async (orderId: number) => {
    try {
      setIsTransacting(true)
      setLastAction('completing_buy')
      await completeBuyOrderOnChain(orderId)
    } catch (error) {
      console.error('Error completing buy order:', error)
      throw error
    } finally {
      setIsTransacting(false)
      setLastAction(null)
    }
  }

  const handleCompleteSellOrder = async (orderId: number) => {
    try {
      setIsTransacting(true)
      setLastAction('completing_sell')
      await completeSellOrderOnChain(orderId)
    } catch (error) {
      console.error('Error completing sell order:', error)
      throw error
    } finally {
      setIsTransacting(false)
      setLastAction(null)
    }
  }

  const handleApproveOrder = async (orderId: number) => {
    try {
      setIsTransacting(true)
      setLastAction('approving')
      await approveOrderOnChain(orderId)
    } catch (error) {
      console.error('Error approving order:', error)
      throw error
    } finally {
      setIsTransacting(false)
      setLastAction(null)
    }
  }

  const handleCreateBuyOrder = async (usdtAmount: string, inrAmount: string, orderType: string) => {
    try {
      setIsTransacting(true)
      setLastAction('creating_buy')
      await createBuyOrderOnChain(usdtAmount, inrAmount, orderType)
    } catch (error) {
      console.error('Error creating buy order:', error)
      throw error
    } finally {
      setIsTransacting(false)
      setLastAction(null)
    }
  }

  return {
    handleVerifyPayment,
    handleCompleteBuyOrder,
    handleCompleteSellOrder,
    handleApproveOrder,
    handleCreateBuyOrder,
    isTransacting,
    lastAction,
    hash
  }
}
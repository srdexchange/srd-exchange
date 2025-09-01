'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { useAdminAPI } from '@/hooks/useAdminAPI'
import { useUserActivity } from '@/hooks/useUserActivity'
import { useRates } from '@/hooks/useRates'
import CancelOrderModal from './modal/cancelOrder'
import { useAdminContract } from '@/hooks/useAdminContract'
import { readContract } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useWalletManager } from '@/hooks/useWalletManager'

interface Order {
  id: string;
  fullId: string;
  time: string;
  amount: number;
  usdtAmount?: number;
  type: string;
  orderType: string;
  price: number;
  currency: string;
  status: string;
  paymentProof?: string;
  adminUpiId?: string;
  adminBankDetails?: string;
  blockchainOrderId?: number;
  user: {
    id: string;
    walletAddress: string;
    upiId: string | null;
    bankDetails: any;
  };
}

// Update to match useWalletManager.ts:
const CONTRACTS = {
  P2P_TRADING: {
    [56]: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Update with mainnet address when deployed
    [97]: '0x68546e6002F1d3a0c3f330d702Fd21db53a4F878' as `0x${string}`, // Your testnet address
  }
}

const P2P_TRADING_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'getOrder',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'orderId', type: 'uint256' },
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'uint256', name: 'usdtAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'inrAmount', type: 'uint256' },
          { internalType: 'bool', name: 'isBuyOrder', type: 'bool' },
          { internalType: 'bool', name: 'isCompleted', type: 'bool' },
          { internalType: 'bool', name: 'isVerified', type: 'bool' },
          { internalType: 'bool', name: 'adminApproved', type: 'bool' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'orderType', type: 'string' },
        ],
        internalType: 'struct P2PTrading.Order',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'orderCounter',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'approveOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function AdminCenter() {
  const [orderStatuses, setOrderStatuses] = useState<{[key: string]: {[key: string]: 'waiting' | 'completed'}}>({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address } = useAccount()
  const chainId = useChainId()
  const { makeAdminRequest } = useAdminAPI()
  const isUserActive = useUserActivity(5000);
  const { getBuyRate, getSellRate } = useRates();
  const [lastCenterRefresh, setLastCenterRefresh] = useState(Date.now());

  // Import all wallet manager functions at the top level
  const { 
    createBuyOrderOnChain,
    completeBuyOrderOnChain,
    completeSellOrderOnChain,
    verifyPaymentOnChain,
    approveOrderOnChain,
    transferUSDT,
    hash: walletHash,
    isPending: walletPending
  } = useWalletManager()

  const { 
    handleVerifyPayment, 
    handleCompleteBuyOrder, 
    handleCompleteSellOrder, 
    handleApproveOrder,
    isTransacting,
    lastAction,
    hash 
  } = useAdminContract()

  useEffect(() => {
    fetchAcceptedOrders()
    
    const handleOrderAccepted = (event: CustomEvent) => {
      console.log('Order accepted event received:', event.detail)
      setTimeout(() => fetchAcceptedOrders(), 1000)
    }
    
    window.addEventListener('orderAccepted', handleOrderAccepted as EventListener)
    
    return () => {
      window.removeEventListener('orderAccepted', handleOrderAccepted as EventListener)
    }
  }, [address])

  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if no order is selected and user is not active
      if (!selectedOrder && !isUserActive) {
        console.log('🔄 Auto-refreshing admin center orders');
        fetchAcceptedOrders();
        setLastCenterRefresh(Date.now());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedOrder, isUserActive]);

  useEffect(() => {
    // Broadcast when order is selected/deselected to pause refresh in other components
    if (selectedOrder) {
      window.dispatchEvent(new CustomEvent('adminOrderSelected'));
    } else {
      window.dispatchEvent(new CustomEvent('adminOrderDeselected'));
    }
  }, [selectedOrder]);

  const fetchAcceptedOrders = async () => {
    if (!address) {
      console.log('No admin wallet address available')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching accepted orders for admin center...')
      
      const data = await makeAdminRequest('/api/admin/orders?status=pending')
      
      if (data.success) {
        const acceptedOrders = data.orders.filter((order: Order) => 
          ['ADMIN_APPROVED', 'PAYMENT_SUBMITTED'].includes(order.status)
        )
        console.log('Accepted orders found:', acceptedOrders.length)
        setOrders(acceptedOrders)
      } else {
        console.error('API returned error:', data.error)
        setError(data.error)
      }
    } catch (error) {
      console.error('Error fetching accepted orders:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch accepted orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string, additionalData: any = {}) => {
    try {
      console.log('Updating order status:', orderId, 'to', status)
      
      const data = await makeAdminRequest(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...additionalData
        })
      })

      if (data.success) {
        console.log('Order status updated successfully')
        fetchAcceptedOrders()
      } else {
        console.error('Failed to update order status:', data.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const getValidOrderId = (order: Order): number => {
    console.log('🔍 Getting valid order ID for:', {
      fullId: order.fullId,
      blockchainOrderId: order.blockchainOrderId,
      id: order.id
    })
    
    // First try blockchainOrderId if it exists
    if (order.blockchainOrderId) {
      const blockchainId = parseInt(order.blockchainOrderId.toString())
      if (!isNaN(blockchainId) && blockchainId > 0) {
        console.log('✅ Using blockchainOrderId:', blockchainId)
        return blockchainId
      }
    }
    
    // Try to extract number from fullId
    const fullIdNumbers = order.fullId.replace(/\D/g, '')
    if (fullIdNumbers) {
      const extractedId = parseInt(fullIdNumbers)
      if (!isNaN(extractedId) && extractedId > 0) {
        console.log('✅ Using extracted ID from fullId:', extractedId)
        return extractedId
      }
    }
    
    // Try to parse the id field
    const parsedId = parseInt(order.id)
    if (!isNaN(parsedId) && parsedId > 0) {
      console.log('✅ Using parsed order.id:', parsedId)
      return parsedId
    }
    
    // Last resort: create a hash-based ID
    let hash = 0
    for (let i = 0; i < order.fullId.length; i++) {
      const char = order.fullId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    const hashId = Math.abs(hash) % 1000000 + 1 // Ensure positive and reasonable size
    
    console.warn('⚠️ Using fallback hash ID:', hashId, 'for order:', order.fullId)
    return hashId
  }

  const handleButtonClick = async (orderIndex: number, tag: string) => {
    const order = orders[orderIndex]
    const currentStatus = orderStatuses[orderIndex]?.[tag]
    
    console.log('🎯 Button clicked:', {
      tag,
      orderIndex,
      currentStatus,
      order: {
        fullId: order.fullId,
        orderType: order.orderType,
        status: order.status,
        amount: order.amount
      }
    })
    
    try {
      // Handle blockchain interactions for specific tags
      if (tag.toLowerCase() === 'verified' && !currentStatus) {
        // First verified button
        console.log('🔗 First verified button clicked...')
        
        if (order.orderType.includes('BUY')) {
          console.log('💰 BUY ORDER: Processing verification and preparation for transfer...')
          
          // For buy orders, just mark as verified in database
          // No blockchain interaction needed at this stage
          await updateOrderStatus(order.fullId, 'PAYMENT_VERIFIED')
          
        } else if (order.orderType.includes('SELL')) {
          console.log('💰 SELL ORDER: Verifying existing blockchain order...')
          
          const orderIdForBlockchain = getValidOrderId(order)
          console.log('📋 Using order ID for SELL verification:', orderIdForBlockchain)
          
          try {
            const orderDetails = await readContract(config as any, {
              address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
              abi: P2P_TRADING_ABI,
              functionName: 'getOrder',
              args: [BigInt(orderIdForBlockchain)],
            })
            
            console.log('📊 SELL order blockchain details:', {
              orderId: orderDetails.orderId.toString(),
              user: orderDetails.user,
              usdtAmount: formatUnits(orderDetails.usdtAmount, 6),
              adminApproved: orderDetails.adminApproved,
              isVerified: orderDetails.isVerified
            })
  
            if (!orderDetails.adminApproved) {
              console.log('🔓 Approving SELL order...')
              await handleApproveOrder(orderIdForBlockchain)
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
  
            if (orderDetails.isVerified) {
              throw new Error('SELL order already verified on blockchain.')
            }
  
            await handleVerifyPayment(orderIdForBlockchain)
            
          } catch (orderCheckError) {
            console.error('❌ Error verifying SELL order:', orderCheckError)
            const errorMessage = orderCheckError instanceof Error ? orderCheckError.message : String(orderCheckError)
            
            if (errorMessage.includes('execution reverted') || errorMessage.includes('returned no data')) {
              console.log('⚠️ SELL order not found on blockchain, skipping blockchain verification...')
            } else {
              throw new Error(`Failed to verify SELL order: ${errorMessage}`)
            }
          }
          
          await updateOrderStatus(order.fullId, 'PAYMENT_VERIFIED')
        }
        
        // Update local UI state
        setOrderStatuses(prev => ({
          ...prev,
          [orderIndex]: {
            ...prev[orderIndex],
            [tag]: 'completed'
          }
        }))
        
        return
      }
      
      if (tag.toLowerCase() === 'verified' && currentStatus === 'completed') {
        // Second verified button - complete the order
        console.log('🔗 Second verified button - completing order...')
        
        if (order.orderType.includes('BUY')) {
          console.log('💸 BUY ORDER: Direct USDT transfer from admin to user...')
          
          try {
            // Calculate USDT amount to transfer
            const buyRate = getBuyRate(order.currency as 'UPI' | 'CDM')
            const usdtAmountToTransfer = (order.amount / buyRate).toFixed(6)
            
            console.log('💰 Transferring USDT:', {
              userAddress: order.user.walletAddress,
              usdtAmount: usdtAmountToTransfer,
              rupeeAmount: order.amount,
              rate: buyRate
            })
            
            // Direct USDT transfer from admin to user (no smart contract needed for buy orders)
            await transferUSDT(order.user.walletAddress as `0x${string}`, usdtAmountToTransfer)
            
            await updateOrderStatus(order.fullId, 'USDT_TRANSFERRED')
            
            setOrderStatuses(prev => ({
              ...prev,
              [orderIndex]: {
                ...prev[orderIndex],
                'Complete': 'completed'
              }
            }))
            
          } catch (transferError) {
            console.error('❌ Error transferring USDT to user:', transferError)
            const errorMessage = transferError instanceof Error ? transferError.message : String(transferError)
            throw new Error(`Failed to transfer USDT to user: ${errorMessage}`)
          }
          
        } else if (order.orderType.includes('SELL')) {
          console.log('💰 SELL ORDER: Completing order to transfer USDT to admin...')
          
          const orderIdForBlockchain = getValidOrderId(order)
          
          try {
            const orderDetails = await readContract(config as any, {
              address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
              abi: P2P_TRADING_ABI,
              functionName: 'getOrder',
              args: [BigInt(orderIdForBlockchain)],
            })
  
            if (!orderDetails.isVerified) {
              throw new Error('SELL order must be verified before completion')
            }
  
            if (orderDetails.isCompleted) {
              throw new Error('SELL order already completed')
            }
  
            if (orderDetails.isBuyOrder) {
              throw new Error('This is not a sell order')
            }
  
            await handleCompleteSellOrder(orderIdForBlockchain)
            await updateOrderStatus(order.fullId, 'USDT_TRANSFERRED_TO_ADMIN')
            
            setOrderStatuses(prev => ({
              ...prev,
              [orderIndex]: {
                ...prev[orderIndex],
                'Complete': 'completed'
              }
            }))
  
          } catch (validationError) {
            console.error('❌ SELL order completion failed:', validationError)
            const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown validation error'
            throw new Error(`SELL order completion failed: ${errorMessage}`)
          }
        }
        
        return
      }
      
      // Handle other button states (existing logic)
      setOrderStatuses(prev => {
        let newStatus: 'waiting' | 'completed' | undefined
        
        if (hasUserIcon(tag, orderIndex)) {
          if (!currentStatus) {
            newStatus = 'waiting'
          } else if (currentStatus === 'waiting') {
            newStatus = 'completed'
            
            if (tag.toLowerCase() === 'complete') {
              updateOrderStatus(order.fullId, 'COMPLETED')
            }
          } else {
            newStatus = 'waiting'
          }
        } else {
          newStatus = currentStatus === 'completed' ? undefined : 'completed'
          
          if (newStatus === 'completed') {
            if (tag.toLowerCase() === 'pay info' || tag.toLowerCase() === 'pay info(full)') {
              updateOrderStatus(order.fullId, 'ADMIN_SENT_PAYMENT_INFO')
            }
          }
        }
  
        return {
          ...prev,
          [orderIndex]: {
            ...prev[orderIndex],
            [tag]: newStatus
          }
        }
      })
      
    } catch (error) {
      console.error('❌ Error in button click handler:', error)
      
      // Enhanced error messages
      let errorMessage = 'Transaction failed.'
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      if (errorMsg.includes('returned no data') || errorMsg.includes('execution reverted')) {
        errorMessage = 'Smart contract error. Please check the contract address and network connection.'
      } else if (errorMsg.includes('insufficient')) {
        errorMessage = 'Insufficient balance. Please ensure admin has enough USDT and BNB for gas fees.'
      } else if (errorMsg.includes('allowance')) {
        errorMessage = 'USDT approval required. Admin needs to approve USDT spending.'
      } else if (errorMsg.includes('Admin insufficient USDT balance')) {
        errorMessage = 'Admin wallet does not have enough USDT to complete this buy order.'
      } else if (errorMsg.includes('USDT transfer failed')) {
        errorMessage = 'USDT transfer failed. Check admin USDT balance and network connection.'
      } else if (errorMsg.includes('Wallet not connected')) {
        errorMessage = 'Please connect your admin wallet.'
      } else if (errorMsg.includes('switch to a supported BSC network')) {
        errorMessage = 'Please switch to BSC testnet.'
      }
      
      alert(`${errorMessage}\n\nDetailed error: ${errorMsg}`)
    }
  }

  const handleAcceptedDoubleClick = (order: Order) => {
    setSelectedOrder(order)
    setShowCancelModal(true)
  }

  const handleCancelOrder = async (reason: string) => {
    if (selectedOrder) {
      await updateOrderStatus(selectedOrder.fullId, 'CANCELLED', { adminNotes: reason })
    }
    
    setShowCancelModal(false)
    setSelectedOrder(null)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setSelectedOrder(null)
  }

  const getButtonStatus = (orderIndex: number, tag: string) => {
    return orderStatuses[orderIndex]?.[tag]
  }

  const getTagColor = (tag: string, orderIndex: number) => {
    const status = getButtonStatus(orderIndex, tag)
    
    if (hasUserIcon(tag, orderIndex)) {
      switch (status) {
        case 'waiting':
          return 'bg-[#622DBF] text-white'
        case 'completed':
          return 'bg-green-600 text-white'
        default:
          return 'bg-gray-600 text-white'
      }
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const hasUserIcon = (tag: string, orderIndex: number) => {
    const normalizedTag = tag.toLowerCase()
    const order = orders[orderIndex]
    
    if (order.currency === 'CDM' && order.type.includes('Buy')) {
      return ['pay info(full)', 'bank details', 'complete'].includes(normalizedTag)
    }
    
    return ['pay info', 'pay info(full)', 'paid', 'complete'].includes(normalizedTag)
  }

  const getOrderTags = (order: Order) => {
    if (order.orderType === 'BUY_CDM') {
      return ['Accepted', 'Pay info(full)', 'Paid', 'Bank details', 'Paid', 'Verified', 'Complete']
    } else if (order.orderType === 'BUY_UPI') {
      return ['Accepted', 'Pay info', 'Verified', 'Paid', 'Verified', 'Complete']
    } else {
      return ['Accepted', 'Paid', 'Verified', 'Complete']
    }
  }

  const handleOrderClick = (order: Order, index: number) => {
    setSelectedOrder(order)
    setSelectedOrderIndex(index)
    
    window.dispatchEvent(new CustomEvent('orderSelected', {
      detail: { order, index }
    }))
  }

  const handleOrderDeselect = () => {
    setSelectedOrder(null)
    setSelectedOrderIndex(null)
    
    window.dispatchEvent(new CustomEvent('orderDeselected'))
  }

  useEffect(() => {
    const handleExternalOrderDeselect = () => {
      setSelectedOrder(null)
      setSelectedOrderIndex(null)
    }

    window.addEventListener('orderDeselected', handleExternalOrderDeselect as EventListener)
    
    return () => {
      window.removeEventListener('orderDeselected', handleExternalOrderDeselect as EventListener)
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedOrder) {
        handleOrderDeselect()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [selectedOrder])

  console.log('Admin Center State:', {
    loading,
    ordersCount: orders.length,
    hasAddress: !!address,
    error
  })

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 overflow-y-auto">
      <div className="flex bg-[#1E1E1E] rounded-sm items-center justify-center mb-6 space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-white p-2">Accepted Orders</h2>
        {selectedOrder && (
          <div className="flex items-center space-x-1 text-xs bg-purple-600/20 px-2 py-1 rounded">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span className="text-purple-400">Selected: {selectedOrder.id}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded text-sm text-red-300">
          <div className="font-medium">Error:</div>
          <div>{error}</div>
        </div>
      )}

      {!address && (
        <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/50 rounded text-sm text-yellow-300">
          <div className="font-medium">Admin wallet not connected</div>
          <div>Please connect your admin wallet to view orders</div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading accepted orders...</p>
          </div>
        ) : !address ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Connect admin wallet to view orders</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No accepted orders found</p>
            <p className="text-xs text-gray-500 mt-2">Orders will appear here after you accept them from the left panel</p>
            {!error && (
              <button 
                onClick={fetchAcceptedOrders}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Refresh Accepted Orders
              </button>
            )}
          </div>
        ) : (
          orders.map((order, index) => {
            const buyRate = getBuyRate(order.currency as 'UPI' | 'CDM');
            const sellRate = getSellRate(order.currency as 'UPI' | 'CDM');
            
            let primaryAmount = '';
            let secondaryAmount = '';
            let rateDisplay = '';
            
            if (order.orderType.includes('BUY')) {
              const usdtAmount = (order.amount / buyRate).toFixed(6);
              primaryAmount = `₹${order.amount}`;
              secondaryAmount = `${usdtAmount} USDT`;
              rateDisplay = `₹${buyRate}/USDT`;
            } else {
              const rupeeAmount = (order.amount * sellRate).toFixed(2);
              primaryAmount = `${order.amount} USDT`;
              secondaryAmount = `₹${rupeeAmount}`;
              rateDisplay = `₹${sellRate}/USDT`;
            }

            return (
              <div 
                key={order.fullId} 
                className={`rounded-md py-2 px-2 cursor-pointer transition-all duration-200 ${
                  selectedOrderIndex === index
                    ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/20 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-[#1D1C1C] border-2 border-transparent hover:bg-[#2A2A2A] hover:border-purple-500/30'
                }`}
                onClick={() => handleOrderClick(order, index)}
              >
                {selectedOrderIndex === index && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-400 text-xs font-medium">SELECTED ORDER</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOrderDeselect()
                      }}
                      className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                    >
                      Deselect
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`text-md font-medium ${
                      selectedOrderIndex === index ? 'text-white' : 'text-white'
                    }`}>
                      {order.id}
                    </span>
                    <div className={`text-xs ${
                      selectedOrderIndex === index ? 'text-purple-200' : 'text-white'
                    }`}>
                      {order.time}
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedOrderIndex === index ? 'text-purple-300' : 'text-gray-400'
                    }`}>
                      {order.user.walletAddress.slice(0, 6)}...{order.user.walletAddress.slice(-4)}
                    </div>
                  </div>

                  <div className={`flex items-center space-x-2 border py-0.5 px-0.5 rounded ${
                    selectedOrderIndex === index ? 'border-purple-400/50' : 'border-[#464646]'
                  }`}>
                    <span className={`font-bold py-0.5 px-1.5 rounded-sm ${
                      selectedOrderIndex === index ? 'bg-purple-800/30 text-white' : 'bg-[#222] text-white'
                    }`}>
                      {primaryAmount}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Image 
                        src={order.type.includes("Buy") ? "/buy.svg" : "/sell.svg"}
                        alt={order.type.includes("Buy") ? "Buy" : "Sell"}
                        width={14} 
                        height={14}
                        className="flex-shrink-0"
                      />
                      <span className={`text-sm ${
                        selectedOrderIndex === index ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {order.type}
                      </span>
                    </div>
                    <span className={`font-bold py-0.5 px-1.5 rounded-sm ${
                      selectedOrderIndex === index ? 'bg-purple-800/30 text-white' : 'bg-[#222] text-white'
                    }`}>
                      {secondaryAmount}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {order.currency === "UPI" ? (
                      <Image 
                        src="/phonepay-gpay.svg" 
                        alt="UPI" 
                        width={20} 
                        height={12}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <Image 
                        src="/bank.svg" 
                        alt="CDM" 
                        width={16} 
                        height={16}
                        className="flex-shrink-0"
                      />
                    )}
                    <span className={`text-sm ${
                      selectedOrderIndex === index ? 'text-white font-medium' : 'text-white'
                    }`}>
                      {order.currency}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-2">
                  <span className={`text-xs ${
                    selectedOrderIndex === index ? 'text-purple-300' : 'text-gray-500'
                  }`}>
                    Rate: {rateDisplay}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getOrderTags(order).map((tag, tagIndex) => (
                    <button
                      key={tagIndex}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonClick(index, tag)
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        if (tag === 'Accepted') {
                          handleAcceptedDoubleClick(order)
                        }
                      }}
                      className={`px-3 py-1 rounded-xs text-xs font-medium flex items-center space-x-1 transition-all hover:opacity-80 cursor-pointer ${getTagColor(tag, index)} ${
                        tag === 'Accepted' ? 'hover:bg-red-600' : ''
                      } ${
                        selectedOrderIndex === index ? 'shadow-sm' : ''
                      }`}
                    >
                      {hasUserIcon(tag, index) && (
                        <User className="w-3 h-3" />
                      )}
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>


                {selectedOrderIndex !== index && (
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs text-gray-500 text-center">
                      Click to select and view details →
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedOrder && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleOrderDeselect}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>Clear Selection</span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">ESC</span>
          </button>
        </div>
      )}

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleCancelOrder}
      />

      {isTransacting && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>
              {lastAction === 'verifying' && 'Verifying payment on blockchain...'}
              {lastAction === 'completing_buy' && 'Transferring USDT to user...'}
              {lastAction === 'completing_sell' && 'Completing sell order...'}
              {lastAction === 'approving' && 'Approving order...'}
              {lastAction === 'creating_buy' && 'Creating buy order on blockchain...'}
            </span>
          </div>
          {hash && (
            <div className="text-xs mt-1">
              <a 
                href={`https://bscscan.com/tx/${hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white"
              >
                View on BSCScan ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

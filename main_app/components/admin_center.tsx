'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useAdminAPI } from '@/hooks/useAdminAPI'
import { useUserActivity } from '@/hooks/useUserActivity'
import { useRates } from '@/hooks/useRates'
import CancelOrderModal from './modal/cancelOrder'
import { useAdminContract } from '@/hooks/useAdminContract'

interface Order {
  id: string;
  fullId: string;
  time: string;
  amount: number;
  type: string;
  orderType: string;
  price: number;
  currency: string;
  status: string;
  paymentProof?: string;
  adminUpiId?: string;
  adminBankDetails?: string;
  user: {
    id: string;
    walletAddress: string;
    upiId: string | null;
    bankDetails: any;
  };
}

export default function AdminCenter() {
  const [orderStatuses, setOrderStatuses] = useState<{[key: string]: {[key: string]: 'waiting' | 'completed'}}>({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address } = useAccount()
  const { makeAdminRequest } = useAdminAPI()
  const isUserActive = useUserActivity(5000);
  const { getBuyRate, getSellRate } = useRates();
  const [lastCenterRefresh, setLastCenterRefresh] = useState(Date.now());

  const { 
    handleVerifyPayment, 
    handleCompleteBuyOrder, 
    handleCompleteSellOrder, 
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

  const handleButtonClick = async (orderIndex: number, tag: string) => {
    const order = orders[orderIndex]
    const currentStatus = orderStatuses[orderIndex]?.[tag]
    
    try {
      // Handle blockchain interactions for specific tags
      if (tag.toLowerCase() === 'verified' && !currentStatus) {
        // First verified button - verify payment on blockchain
        console.log('🔗 Verifying payment on blockchain...')
        await handleVerifyPayment(parseInt(order.fullId))
        
        // Update database status
        await updateOrderStatus(order.fullId, 'PAYMENT_VERIFIED')
        
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
        // Second verified button for buy orders - transfer USDT
        if (order.orderType.includes('BUY')) {
          console.log('🔗 Completing buy order and transferring USDT...')
          await handleCompleteBuyOrder(parseInt(order.fullId))
          
          // Update database status
          await updateOrderStatus(order.fullId, 'USDT_TRANSFERRED')
          
          // Auto-mark as completed
          setOrderStatuses(prev => ({
            ...prev,
            [orderIndex]: {
              ...prev[orderIndex],
              'Complete': 'completed'
            }
          }))
        } else {
          // Sell order
          console.log('🔗 Completing sell order...')
          await handleCompleteSellOrder(parseInt(order.fullId))
          
          await updateOrderStatus(order.fullId, 'USDT_RECEIVED_BY_ADMIN')
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
      alert('Transaction failed. Please try again.')
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
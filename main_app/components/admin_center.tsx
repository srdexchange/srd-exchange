'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useAdminAPI } from '@/hooks/useAdminAPI'
import CancelOrderModal from './modal/cancelOrder'

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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address } = useAccount()
  const { makeAdminRequest } = useAdminAPI()

  useEffect(() => {
    fetchAcceptedOrders()
    
    // Listen for order acceptance events from left panel
    const handleOrderAccepted = (event: CustomEvent) => {
      console.log('Order accepted event received:', event.detail)
      // Refresh accepted orders when an order is accepted
      setTimeout(() => fetchAcceptedOrders(), 1000) // Small delay to ensure DB is updated
    }
    
    window.addEventListener('orderAccepted', handleOrderAccepted as EventListener)
    
    // Also set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (address) {
        fetchAcceptedOrders()
      }
    }, 30000)
    
    return () => {
      window.removeEventListener('orderAccepted', handleOrderAccepted as EventListener)
      clearInterval(interval)
    }
  }, [address])

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
      
      // Fetch all pending orders and filter for accepted ones
      const data = await makeAdminRequest('/api/admin/orders?status=pending')
      
      if (data.success) {
        // Filter to only show accepted orders (not just pending)
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
        // Refresh orders
        fetchAcceptedOrders()
      } else {
        console.error('Failed to update order status:', data.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const handleButtonClick = (orderIndex: number, tag: string) => {
    const order = orders[orderIndex]
    
    setOrderStatuses(prev => {
      const currentStatus = prev[orderIndex]?.[tag]
      let newStatus: 'waiting' | 'completed'
      
      if (hasUserIcon(tag, orderIndex)) {
        // User buttons: cycle through gray -> purple (waiting) -> green (completed)
        if (!currentStatus) {
          newStatus = 'waiting'
        } else if (currentStatus === 'waiting') {
          newStatus = 'completed'
          
          // Handle specific completion actions
          if (tag.toLowerCase() === 'complete') {
            updateOrderStatus(order.fullId, 'COMPLETED')
          }
        } else {
          newStatus = 'waiting'
        }
      } else {
        // Non-user buttons: toggle between gray and green
        newStatus = currentStatus === 'completed' ? undefined as any : 'completed'
        
        // Handle admin actions
        if (newStatus === 'completed') {
          if (tag.toLowerCase() === 'verified') {
            updateOrderStatus(order.fullId, 'PAYMENT_SUBMITTED')
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
    
    // Buttons with user icons
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
    
    // Buttons without user icons
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
    
    // For CDM Buy orders, special logic
    if (order.currency === 'CDM' && order.type.includes('Buy')) {
      return ['pay info(full)', 'bank details', 'complete'].includes(normalizedTag)
    }
    
    // For all other orders (UPI and Sell orders)
    return ['pay info', 'pay info(full)', 'paid', 'complete'].includes(normalizedTag)
  }

  const getOrderTags = (order: Order) => {
    if (order.orderType === 'BUY_CDM') {
      return ['Accepted', 'Pay info(full)', 'Paid', 'Bank details', 'Paid', 'Verified', 'Complete']
    } else if (order.orderType === 'BUY_UPI') {
      return ['Accepted', 'Pay info', 'Verified', 'Paid', 'Verified', 'Complete']
    } else { // SELL
      return ['Accepted', 'Paid', 'Verified', 'Complete']
    }
  }

  // Debug log
  console.log('Admin Center State:', {
    loading,
    ordersCount: orders.length,
    hasAddress: !!address,
    error
  })

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 overflow-y-auto">
      {/* Header */}
      <div className="flex bg-[#1E1E1E] rounded-sm items-center justify-center mb-6 space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-white p-2">Accepted Orders</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded text-sm text-red-300">
          <div className="font-medium">Error:</div>
          <div>{error}</div>
        </div>
      )}

      {/* Wallet Connection Status */}
      {!address && (
        <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/50 rounded text-sm text-yellow-300">
          <div className="font-medium">Admin wallet not connected</div>
          <div>Please connect your admin wallet to view orders</div>
        </div>
      )}

      {/* Orders List */}
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
          orders.map((order, index) => (
            <div key={order.fullId} className="bg-[#1D1C1C] rounded-md py-2 px-2">
              {/* Order Header with Details in Same Row */}
              <div className="flex items-center justify-between mb-3">
                {/* Left - Order ID and Time */}
                <div>
                  <span className="text-white text-md">{order.id}</span>
                  <div className="text-white text-xs">{order.time}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {order.user.walletAddress.slice(0, 6)}...{order.user.walletAddress.slice(-4)}
                  </div>
                </div>

                {/* Middle - Order Details */}
                <div className="flex items-center space-x-2 border border-[#464646] py-0.5 px-0.5 rounded">
                  {order.type.includes("Buy") ? (
                    // Buy Order: Show Rupee amount first, then Dollar price
                    <>
                      <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                        <span>{order.amount}</span>
                        <span className="text-yellow-500">₹</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <Image 
                          src="/buy.svg" 
                          alt="Buy" 
                          width={14} 
                          height={14}
                          className="flex-shrink-0"
                        />
                        <span className="text-gray-400 text-sm">{order.type}</span>
                      </div>
                      <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                        <span>{order.price}</span>
                        <span className="text-purple-500">$</span>
                      </span>
                    </>
                  ) : (
                    // Sell Order: Show Dollar amount first, then Rupee price
                    <>
                      <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                        <span>{order.price}</span>
                        <span className="text-purple-500">$</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <Image 
                          src="/sell.svg" 
                          alt="Sell" 
                          width={14} 
                          height={14}
                          className="flex-shrink-0"
                        />
                        <span className="text-gray-400 text-sm">{order.type}</span>
                      </div>
                      <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                        <span>{order.amount}</span>
                        <span className="text-yellow-500">₹</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Right - Currency Icon */}
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
                  <span className="text-white text-sm">{order.currency}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {getOrderTags(order).map((tag, tagIndex) => (
                  <button
                    key={tagIndex}
                    onClick={() => handleButtonClick(index, tag)}
                    onDoubleClick={() => {
                      if (tag === 'Accepted') {
                        handleAcceptedDoubleClick(order)
                      }
                    }}
                    className={`px-3 py-1 rounded-xs text-xs font-medium flex items-center space-x-1 transition-all hover:opacity-80 cursor-pointer ${getTagColor(tag, index)} ${
                      tag === 'Accepted' ? 'hover:bg-red-600' : ''
                    }`}
                  >
                    {hasUserIcon(tag, index) && (
                      <User className="w-3 h-3" />
                    )}
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleCancelOrder}
      />
    </div>
  )
}
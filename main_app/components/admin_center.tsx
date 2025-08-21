'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'

export default function AdminCenter() {
  const [orderStatuses, setOrderStatuses] = useState<{[key: string]: {[key: string]: 'waiting' | 'completed'}}>({})

  const orders = [
    {
      id: '#24234',
      time: 'Today 11:40 PM',
      amount: 1000,
      type: 'Buy Order',
      price: 1.5,
      currency: 'UPI',
      status: 'accepted',
      tags: ['Accepted', 'Pay info', 'Verified', 'Paid', 'Verified', 'Complete']
    },
    {
      id: '#24234',
      time: 'Today 11:40 PM',
      amount: 1000,
      type: 'Buy Order',
      price: 1.5,
      currency: 'CDM',
      status: 'processing',
      tags: ['Accepted', 'Pay info(full)', 'Paid', 'Bank details', 'Paid', 'Verified', 'Complete']
    },
    {
      id: '#24234',
      time: 'Today 11:40 PM',
      amount: 1000,
      type: 'Sell Order',
      price: 1.5,
      currency: 'UPI',
      status: 'completed',
      tags: ['Accepted', 'Paid', 'Verified', 'Complete']
    },
    {
      id: '#24234',
      time: 'Today 11:40 PM',
      amount: 1000,
      type: 'Sell Order',
      price: 1.5,
      currency: 'UPI',
      status: 'completed',
      tags: ['Accepted', 'Paid', 'Verified', 'Complete']
    }
  ]

  const handleButtonClick = (orderIndex: number, tag: string) => {
    setOrderStatuses(prev => {
      const currentStatus = prev[orderIndex]?.[tag]
      let newStatus: 'waiting' | 'completed'
      
      if (hasUserIcon(tag, orderIndex)) {
        // User buttons: cycle through gray -> purple (waiting) -> green (completed)
        if (!currentStatus) {
          newStatus = 'waiting'
        } else if (currentStatus === 'waiting') {
          newStatus = 'completed'
        } else {
          newStatus = 'waiting' // Reset to waiting if clicked again
        }
      } else {
        // Non-user buttons: toggle between gray and green
        newStatus = currentStatus === 'completed' ? undefined as any : 'completed'
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

  const getButtonStatus = (orderIndex: number, tag: string) => {
    return orderStatuses[orderIndex]?.[tag]
  }

  const getTagColor = (tag: string, orderIndex: number) => {
    const status = getButtonStatus(orderIndex, tag)
    
    // Buttons with user icons
    if (hasUserIcon(tag, orderIndex)) {
      switch (status) {
        case 'waiting':
          return 'bg-[#622DBF] text-white' // Purple when waiting
        case 'completed':
          return 'bg-green-600 text-white' // Green when completed
        default:
          return 'bg-gray-600 text-white' // Gray when not started
      }
    }
    
    // Buttons without user icons
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white' // Green when clicked
      default:
        return 'bg-gray-600 text-white' // Gray when not clicked
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

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 overflow-y-auto">
      {/* Header */}
      <div className="flex bg-[#1E1E1E] rounded-sm items-center justify-center mb-6 space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-white p-2">Accepted Orders</h2>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div key={index} className="bg-[#1D1C1C] rounded-md py-2 px-2">
            {/* Order Header with Details in Same Row */}
            <div className="flex items-center justify-between mb-3">
              {/* Left - Order ID and Time */}
              <div>
                <span className="text-white text-md">{order.id}</span>
                <div className="text-white text-xs">{order.time}</div>
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
              {order.tags.map((tag, tagIndex) => (
                <button
                  key={tagIndex}
                  onClick={() => handleButtonClick(index, tag)}
                  className={`px-3 py-1 rounded-xs text-xs font-medium flex items-center space-x-1 transition-all hover:opacity-80 cursor-pointer ${getTagColor(tag, index)}`}
                >
                  {hasUserIcon(tag, index) && (
                    <User className="w-3 h-3" />
                  )}
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
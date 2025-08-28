"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import CancelOrderModal from "./modal/cancelOrder";

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
  user: {
    id: string;
    walletAddress: string;
    upiId: string | null;
    bankDetails: any;
  };
}

export default function AdminLeftSide() {
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch orders based on active filter
  useEffect(() => {
    fetchOrders();
  }, [activeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statusParam = activeFilter.toLowerCase();
      const response = await fetch(`/api/admin/orders?status=${statusParam}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (order: Order) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.fullId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ADMIN_APPROVED'
        }),
      });

      if (response.ok) {
        // Refresh orders
        fetchOrders();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleReject = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (selectedOrder) {
      try {
        const response = await fetch(`/api/admin/orders/${selectedOrder.fullId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'CANCELLED',
            adminNotes: reason
          }),
        });

        if (response.ok) {
          // Refresh orders
          fetchOrders();
        }
      } catch (error) {
        console.error('Error rejecting order:', error);
      }
    }
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'ADMIN_APPROVED':
        return 'bg-blue-500';
      case 'PAYMENT_SUBMITTED':
        return 'bg-purple-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 overflow-y-auto">
      {/* Header */}
      <div className="flex bg-[#1E1E1E] rounded-sm items-center justify-center mb-6 space-x-2">
        <div className="w-2 h-2 bg-[#622DBF] rounded-full"></div>
        <h2 className="text-lg font-semibold text-white p-2">All Orders</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 flex justify-center">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-gray-400"/>
        </div>
        <input
          type="text"
          placeholder="Search by Order ID or Wallet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[95%] bg-[#111010] rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 w-[90%] mx-auto">
        <button
          onClick={() => setActiveFilter("Pending")}
          className={`flex items-center justify-center space-x-2 py-1 px-2 rounded-xs text-xs font-medium transition-all flex-1 min-w-0 ${
            activeFilter === "Pending"
              ? "bg-[#622DBF] text-white"
              : "bg-[#1E1E1E] text-gray-300 hover:bg-gray-700/50"
          }`}
        >
          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
          <span className="truncate">Pending</span>
        </button>
        <button
          onClick={() => setActiveFilter("Completed")}
          className={`flex items-center justify-center space-x-2 py-1 px-2 rounded-xs text-xs font-medium transition-all flex-1 min-w-0 ${
            activeFilter === "Completed"
              ? "bg-[#622DBF] text-white"
              : "bg-[#1E1E1E] text-gray-300 hover:bg-gray-700/50"
          }`}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="truncate">Completed</span>
        </button>
        <button
          onClick={() => setActiveFilter("Rejected")}
          className={`flex items-center justify-center space-x-2 py-1 px-2 rounded-xs text-xs font-medium transition-all flex-1 min-w-0 ${
            activeFilter === "Rejected"
              ? "bg-[#622DBF] text-white"
              : "bg-[#1E1E1E] text-gray-300 hover:bg-gray-700/50"
          }`}
        >
          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
          <span className="truncate">Rejected</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.fullId}
              className="bg-[#1D1C1C] rounded-md py-2 px-2"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white text-md">{order.id}</span>
                  <div className="text-white text-xs">{order.time}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {order.user.walletAddress.slice(0, 6)}...{order.user.walletAddress.slice(-4)}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
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
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                </div>
              </div>

              {/* Order Details */}
              <div className="flex items-center justify-center mb-3">
                <div className="flex items-center space-x-2 border border-[#464646] py-0.5 px-0.5 rounded">
                  <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                    <span>{order.amount}</span>
                    <span className="text-yellow-500">₹</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    {order.type.includes("Buy") ? (
                      <Image 
                        src="/buy.svg" 
                        alt="Buy" 
                        width={14} 
                        height={14}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <Image 
                        src="/sell.svg" 
                        alt="Sell" 
                        width={14} 
                        height={14}
                        className="flex-shrink-0"
                      />
                    )}
                    <span className="text-gray-400 text-sm">{order.type}</span>
                  </div>
                  <span className="text-white font-bold bg-[#222] py-0.5 px-1.5 rounded-sm flex items-center space-x-1">
                    <span>{order.price}</span>
                    <span className="text-purple-500">$</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons - Only show for pending orders */}
              {activeFilter === "Pending" && order.status === "PENDING" && (
                <div className="flex space-x-3 justify-end">
                  <button 
                    onClick={() => handleAccept(order)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-1 rounded-xs text-sm font-medium transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleReject(order)}
                    className="bg-yellow-600 hover:bg-red-700 text-white px-6 py-1 rounded-xs text-sm font-medium transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

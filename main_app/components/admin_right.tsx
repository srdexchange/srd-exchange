'use client'

import { useState, useEffect } from 'react'
import { User, FileText, Copy, CheckCircle, AlertTriangle, RefreshCw, Send, Edit3 } from 'lucide-react'
import { useRates } from '@/hooks/useRates'
import { useAdminRates } from '@/hooks/useAdminRates'
import { useAdminAPI } from '@/hooks/useAdminAPI'
import { motion, AnimatePresence } from 'framer-motion'

interface SelectedOrder {
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

export default function AdminRight() {
  const [activeTab, setActiveTab] = useState('UPI')
  const [userDetailsTab, setUserDetailsTab] = useState('UPI')
  const [newBuyRate, setNewBuyRate] = useState('')
  const [newSellRate, setNewSellRate] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null)
  const [adminUpiId, setAdminUpiId] = useState('')
  const [adminBankDetails, setAdminBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountHolderName: ''
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [sendingPaymentDetails, setSendingPaymentDetails] = useState(false)
  const [paymentDetailsSent, setPaymentDetailsSent] = useState(false)

  // Custom order values
  const [customOrderValue, setCustomOrderValue] = useState('')
  const [isEditingOrderValue, setIsEditingOrderValue] = useState(false)

  // Custom amount
  const [customAmount, setCustomAmount] = useState('')

  const { rates, loading, refetch } = useRates()
  const { updateRates, loading: updating, error: updateError } = useAdminRates()
  const { makeAdminRequest } = useAdminAPI()

  // Get current rates for selected currency
  const currentRate = rates.find(rate => rate.currency === activeTab)
  const currentBuyRate = currentRate?.buyRate.toString() || '85.6'
  const currentSellRate = currentRate?.sellRate.toString() || '85.6'

  const [isOrderSelected, setIsOrderSelected] = useState(false)

  // Listen for order selection events from admin center
  useEffect(() => {
    const handleOrderSelected = (event: CustomEvent) => {
      console.log('Order selected event received in admin right:', event.detail);
      const selectedOrderData = event.detail.order;
      
      console.log('Setting selected order:', {
        id: selectedOrderData.id,
        fullId: selectedOrderData.fullId,
        orderType: selectedOrderData.orderType,
        amount: selectedOrderData.amount
      });
      
      setSelectedOrder(selectedOrderData);
      setCustomOrderValue(selectedOrderData.amount.toString());
      setIsEditingOrderValue(false);
      setPaymentDetailsSent(false);
      setIsOrderSelected(true); // Add this line
      
      // Set the user details tab based on order type
      if (selectedOrderData.currency === 'CDM') {
        setUserDetailsTab('BANK');
      } else {
        setUserDetailsTab('UPI');
      }
    };

    const handleOrderDeselected = () => {
      console.log('Order deselected');
      setSelectedOrder(null);
      setCustomOrderValue('');
      setIsEditingOrderValue(false);
      setPaymentDetailsSent(false);
      setIsOrderSelected(false); // Add this line
    };

    window.addEventListener('orderSelected', handleOrderSelected as EventListener);
    window.addEventListener('orderDeselected', handleOrderDeselected as EventListener);

    return () => {
      window.removeEventListener('orderSelected', handleOrderSelected as EventListener);
      window.removeEventListener('orderDeselected', handleOrderDeselected as EventListener);
    };
  }, []);

  // Reset input fields when tab changes
  useEffect(() => {
    setNewBuyRate('')
    setNewSellRate('')
    setUpdateSuccess(false)
  }, [activeTab])

  // Auto-refresh rates every 10 seconds to sync with latest changes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [refetch])

  const handleUpdatePrice = async () => {
    if (!newBuyRate || !newSellRate) {
      return
    }

    try {
      console.log('Updating rates:', { currency: activeTab, buyRate: newBuyRate, sellRate: newSellRate })
      
      await updateRates(activeTab as 'UPI' | 'CDM', newBuyRate, newSellRate)
      
      // Wait a moment then refresh rates
      setTimeout(async () => {
        await refetch()
        
        // Broadcast rate update event to other components
        window.dispatchEvent(new CustomEvent('ratesUpdated', {
          detail: {
            currency: activeTab,
            buyRate: parseFloat(newBuyRate),
            sellRate: parseFloat(newSellRate)
          }
        }))
      }, 500)
      
      setNewBuyRate('')
      setNewSellRate('')
      setUpdateSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update rates:', error)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSendPaymentDetails = async (paymentMethod: 'BUY_UPI' | 'BUY_CDM') => {
    if (!selectedOrder) {
      console.error('No selected order available');
      return;
    }

    console.log('🚀 Starting to send payment details for order:', selectedOrder);
    setSendingPaymentDetails(true);

    try {
      // Use the fullId as the primary identifier, fallback to id
      const orderId = selectedOrder.fullId || selectedOrder.id;
      
      // Ensure adminUpiId is properly trimmed and not empty
      const trimmedUpiId = adminUpiId.trim();
      
      // Validate required fields
      if (paymentMethod === 'BUY_UPI') {
        if (!trimmedUpiId || trimmedUpiId.length === 0) {
          alert('Please enter a valid UPI ID');
          setSendingPaymentDetails(false);
          return;
        }
        console.log('✅ UPI ID validation passed:', trimmedUpiId);
      }
      
      if (paymentMethod === 'BUY_CDM' && (!adminBankDetails.accountNumber || !adminBankDetails.ifscCode)) {
        alert('Please enter complete bank details');
        setSendingPaymentDetails(false);
        return;
      }
      
      // Prepare payment details for database
      const paymentDetailsUpdate = {
        status: 'ADMIN_APPROVED',
        adminUpiId: paymentMethod === 'BUY_UPI' ? trimmedUpiId : null,
        adminBankDetails: paymentMethod === 'BUY_CDM' ? JSON.stringify(adminBankDetails) : null,
        adminNotes: `Payment details provided. Amount: ${customOrderValue}`,
        amount: parseFloat(customOrderValue) || selectedOrder.amount // Update amount if custom amount is set
      };

      // Update order in database with admin payment details
      const updateResponse = await makeAdminRequest(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(paymentDetailsUpdate)
      });

      console.log('✅ Database update response:', updateResponse);

      if (updateResponse.success) {
        // Mark as sent
        setPaymentDetailsSent(true);
        
        // Show success message
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        
        console.log('🎉 Payment details saved to database successfully!');
        
        // Clear form fields
        if (paymentMethod === 'BUY_UPI') {
          setAdminUpiId('');
        } else {
          setAdminBankDetails({
            accountNumber: '',
            ifscCode: '',
            branchName: '',
            accountHolderName: ''
          });
        }
      } else {
        throw new Error(updateResponse.error || 'Failed to update order');
      }

    } catch (error) {
      console.error('💥 Error sending payment details:', error);
      alert('Failed to send payment details. Please try again.');
    } finally {
      setSendingPaymentDetails(false);
    }
  }

  const handleOrderValueChange = () => {
    setIsEditingOrderValue(false)
    // Validate the custom value
    const value = parseFloat(customOrderValue)
    if (isNaN(value) || value <= 0) {
      setCustomOrderValue(selectedOrder?.amount.toString() || '')
    }
  }

  if (loading) {
    return (
      <div className="bg-[#141414] text-white h-full py-4 px-2 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading rates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 space-y-6 overflow-y-auto font-montserrat">
      {/* Rate Management Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        {/* Tab Buttons */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => setActiveTab('UPI')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all font-montserrat ${
              activeTab === 'UPI'
                ? 'bg-[#622DBF] text-white'
                : 'bg-[#101010] text-gray-300 border border-[#3E3E3E] hover:bg-gray-700/50'
            }`}
          >
            UPI
          </button>
          <button
            onClick={() => setActiveTab('CDM')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all font-montserrat ${
              activeTab === 'CDM'
                ? 'bg-[#622DBF] text-white'
                : 'bg-[#101010] text-gray-300 border border-[#3E3E3E] hover:bg-gray-700/50'
            }`}
          >
            CDM
          </button>
        </div>

        {/* Rate Management Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-1 font-montserrat">Rate Management</h2>
          <p className="text-gray-400 text-sm font-montserrat">Update Buy and Sell rates for USDT ({activeTab})</p>
        </div>

        {/* Current Rates with Real-time Updates */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1 font-montserrat">Current Buy Rate</div>
            <motion.div 
              className="text-3xl font-bold text-white font-montserrat"
              key={`buy-${currentBuyRate}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {currentBuyRate} ₹
            </motion.div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1 font-montserrat">Current Sell Rate</div>
            <motion.div 
              className="text-3xl font-bold text-white font-montserrat"
              key={`sell-${currentSellRate}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {currentSellRate} ₹
            </motion.div>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 font-montserrat">
            Last updated: {currentRate?.updatedAt ? new Date(currentRate.updatedAt).toLocaleTimeString() : 'Never'}
          </p>
        </div>

        {/* New Rates Input */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <div className="text-gray-400 text-sm mb-2 font-montserrat">New Buy Rate</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-montserrat">₹</span>
              <input
                type="number"
                step="0.01"
                value={newBuyRate}
                onChange={(e) => setNewBuyRate(e.target.value)}
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                placeholder={currentBuyRate}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-400 text-sm mb-2 font-montserrat">New Sell Rate</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-montserrat">₹</span>
              <input
                type="number"
                step="0.01"
                value={newSellRate}
                onChange={(e) => setNewSellRate(e.target.value)}
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                placeholder={currentSellRate}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {updateError && (
            <motion.div
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm font-montserrat">{updateError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Display */}
        <AnimatePresence>
          {updateSuccess && (
            <motion.div
              className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm font-montserrat">
                  {activeTab} rates updated successfully! Changes will reflect across the platform.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Price Button */}
        <button 
          onClick={handleUpdatePrice}
          disabled={updating || !newBuyRate || !newSellRate}
          className="w-full bg-[#622DBF] hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md font-bold transition-all shadow-lg shadow-purple-600/25 font-montserrat"
        >
          {updating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Updating Rates...</span>
            </div>
          ) : (
            `Update ${activeTab} Rates`
          )}
        </button>
      </div>

      {/* Selected Order Info */}
      {selectedOrder ? (
        <>
          {/* Order Info Section with Custom Value */}
          <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white font-montserrat">Selected Order</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500 text-sm font-montserrat">Active</span>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('orderDeselected'))}
                  className="text-gray-400 hover:text-white text-xs px-3 py-1 rounded bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                >
                  Deselect
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm font-montserrat">Order ID:</span>
                <span className="text-white text-sm font-montserrat">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm font-montserrat">Type:</span>
                <span className="text-white text-sm font-montserrat">{selectedOrder.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-montserrat">Original Amount:</span>
                <span className="text-gray-300 text-sm font-montserrat">₹{selectedOrder.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-montserrat">Custom Amount:</span>
                <div className="flex items-center space-x-2">
                  {isEditingOrderValue ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={customOrderValue}
                          onChange={(e) => setCustomOrderValue(e.target.value)}
                          onBlur={handleOrderValueChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleOrderValueChange()}
                          className="w-20 bg-[#1E1C1C] border border-gray-600/50 rounded py-1 pl-5 pr-2 text-white text-sm focus:outline-none focus:border-[#622DBF]"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleOrderValueChange}
                        className="text-green-400 hover:text-green-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm font-montserrat font-bold">₹{customOrderValue}</span>
                      <button
                        onClick={() => setIsEditingOrderValue(true)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm font-montserrat">Rate:</span>
                <span className="text-white text-sm font-montserrat">${selectedOrder.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm font-montserrat">Currency:</span>
                <span className="text-white text-sm font-montserrat">{selectedOrder.currency}</span>
              </div>
            </div>
          </div>

          {/* User Info Section */}
          <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
            <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">User Info</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-montserrat">
                  {selectedOrder.user.walletAddress.slice(0, 6)}...{selectedOrder.user.walletAddress.slice(-4)}
                </span>
                <button 
                  onClick={() => handleCopy(selectedOrder.user.walletAddress, 'wallet')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copiedField === 'wallet' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Bank & UPI Details Section */}
          <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
            <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">User Payment Details</h3>
            
            {/* Tab Buttons */}
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={() => setUserDetailsTab('UPI')}
                className={`py-2 px-4 rounded text-sm font-medium transition-all font-montserrat ${
                  userDetailsTab === 'UPI'
                    ? 'bg-[#622DBF] text-white'
                    : 'bg-[#1E1C1C] text-gray-400 border border-gray-600/50 hover:bg-gray-700/50'
                }`}
              >
                USER UPI ID
              </button>
              <button 
                onClick={() => setUserDetailsTab('BANK')}
                className={`py-2 px-4 rounded text-sm font-medium transition-all font-montserrat ${
                  userDetailsTab === 'BANK'
                    ? 'bg-[#622DBF] text-white'
                    : 'bg-[#1E1C1C] text-gray-400 border border-gray-600/50 hover:bg-gray-700/50'
                }`}
              >
                USER BANK DETAILS
              </button>
            </div>

            {/* UPI Details */}
            {userDetailsTab === 'UPI' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-white" />
                    <span className="text-gray-400 text-sm font-montserrat">User UPI ID</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                    <span className="text-white text-sm font-montserrat flex-1">
                      {selectedOrder.user.upiId || 'Not provided'}
                    </span>
                    {selectedOrder.user.upiId && (
                      <button 
                        onClick={() => handleCopy(selectedOrder.user.upiId!, 'userUpi')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedField === 'userUpi' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Verification Status</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedOrder.user.upiId ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-montserrat ${selectedOrder.user.upiId ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedOrder.user.upiId ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {userDetailsTab === 'BANK' && (
              <div className="space-y-4">
                {selectedOrder.user.bankDetails ? (
                  <>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-400 text-sm font-montserrat">Account Number</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                        <span className="text-white text-sm font-montserrat flex-1">
                          ****{selectedOrder.user.bankDetails.accountNumber?.slice(-4) || '****'}
                        </span>
                        <button 
                          onClick={() => handleCopy(selectedOrder.user.bankDetails.accountNumber, 'accountNumber')}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedField === 'accountNumber' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-400 text-sm font-montserrat">IFSC CODE</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                        <span className="text-white text-sm font-montserrat flex-1">
                          {selectedOrder.user.bankDetails.ifscCode || 'Not provided'}
                        </span>
                        {selectedOrder.user.bankDetails.ifscCode && (
                          <button 
                            onClick={() => handleCopy(selectedOrder.user.bankDetails.ifscCode, 'ifsc')}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedField === 'ifsc' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-400 text-sm font-montserrat">Bank Name</span>
                      </div>
                      <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                        <span className="text-white text-sm font-montserrat">
                          {selectedOrder.user.bankDetails.bankName || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-400 text-sm font-montserrat">Branch Name</span>
                      </div>
                      <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                        <span className="text-white text-sm font-montserrat">
                          {selectedOrder.user.bankDetails.branchName || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-400 text-sm font-montserrat">Account Holder Name</span>
                      </div>
                      <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                        <span className="text-white text-sm font-montserrat">
                          {selectedOrder.user.bankDetails.accountHolderName || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 font-montserrat">No bank details provided</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment section for UPI */}
          {selectedOrder.orderType === 'BUY_UPI' && (
            <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
              <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">Send UPI Payment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-white" />
                    <span className="text-gray-400 text-sm font-montserrat">Admin UPI ID</span>
                  </div>
                  <input
                    type="text"
                    value={adminUpiId}
                    onChange={(e) => setAdminUpiId(e.target.value)}
                    className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                    placeholder="Enter your UPI ID"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Amount user should pay</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-montserrat">₹</span>
                    <input
                      type="text"
                      value={customOrderValue}
                      readOnly
                      className="w-full bg-[#2a2a2a] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white focus:outline-none font-montserrat font-bold"
                    />
                  </div>
                </div>

                {paymentDetailsSent && (
                  <motion.div
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-md"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-sm font-montserrat">
                        Payment details sent to user! They will see your UPI ID and the custom amount.
                      </p>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={() => handleSendPaymentDetails('BUY_UPI')}
                  disabled={!adminUpiId || sendingPaymentDetails || paymentDetailsSent}
                  className="w-full bg-[#622DBF] hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-6 rounded-md font-medium transition-all font-montserrat"
                >
                  {sendingPaymentDetails ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : paymentDetailsSent ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Payment Details Sent</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Send UPI Details to User</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payment section for CDM */}
          {selectedOrder.orderType === 'BUY_CDM' && (
            <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
              <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">Send Bank Payment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Admin Account Number</span>
                  </div>
                  <input
                    type="text"
                    value={adminBankDetails.accountNumber}
                    onChange={(e) => setAdminBankDetails({...adminBankDetails, accountNumber: e.target.value})}
                    className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">IFSC CODE</span>
                  </div>
                  <input
                    type="text"
                    value={adminBankDetails.ifscCode}
                    onChange={(e) => setAdminBankDetails({...adminBankDetails, ifscCode: e.target.value})}
                    className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                    placeholder="Enter IFSC code"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Branch Name</span>
                  </div>
                  <input
                    type="text"
                    value={adminBankDetails.branchName}
                    onChange={(e) => setAdminBankDetails({...adminBankDetails, branchName: e.target.value})}
                    className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                    placeholder="Enter branch name"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Account Holder Name</span>
                  </div>
                  <input
                    type="text"
                    value={adminBankDetails.accountHolderName}
                    onChange={(e) => setAdminBankDetails({...adminBankDetails, accountHolderName: e.target.value})}
                    className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                    placeholder="Enter account holder name"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400 text-sm font-montserrat">Amount user should pay</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-montserrat">₹</span>
                    <input
                      type="text"
                      value={customOrderValue}
                      readOnly
                      className="w-full bg-[#2a2a2a] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white focus:outline-none font-montserrat font-bold"
                    />
                  </div>
                </div>

                {paymentDetailsSent && (
                  <motion.div
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-md"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-sm font-montserrat">
                        Payment details sent to user! They will see your bank details and the custom amount.
                      </p>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={() => handleSendPaymentDetails('BUY_CDM')}
                  disabled={!adminBankDetails.accountNumber || !adminBankDetails.ifscCode || sendingPaymentDetails || paymentDetailsSent}
                  className="w-full bg-[#622DBF] hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-6 rounded-md font-medium transition-all font-montserrat"
                >
                  {sendingPaymentDetails ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : paymentDetailsSent ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Payment Details Sent</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Send Bank Details to User</span>
                    </div>
                  )}
                </button>

                {/* Payment Receipt Section */}
                <div className="mt-6">
                  <h4 className="text-gray-400 text-sm mb-3 font-montserrat">Payment Receipt (CDM)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm font-montserrat">No receipts uploaded yet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Order Selected */
        <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
          <div className="text-center py-8">
            <div className="mb-4">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-montserrat">No Order Selected</h3>
            <p className="text-gray-400 text-sm font-montserrat">
              Select an order from the center panel to view user details and manage payment information.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
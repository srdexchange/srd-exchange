'use client'

import { useState, useEffect } from 'react'
import { User, FileText, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { useRates } from 'hooks/useRates'
import { useAdminRates } from 'hooks/useAdminRates'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminRight() {
  const [activeTab, setActiveTab] = useState('UPI')
  const [userDetailsTab, setUserDetailsTab] = useState('BANK')
  const [newBuyRate, setNewBuyRate] = useState('')
  const [newSellRate, setNewSellRate] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const { rates, loading, refetch } = useRates()
  const { updateRates, loading: updating, error: updateError } = useAdminRates()

  // Get current rates for selected currency
  const currentRate = rates.find(rate => rate.currency === activeTab)
  const currentBuyRate = currentRate?.buyRate.toString() || '85.6'
  const currentSellRate = currentRate?.sellRate.toString() || '85.6'

  // Reset input fields when tab changes
  useEffect(() => {
    setNewBuyRate('')
    setNewSellRate('')
    setUpdateSuccess(false)
  }, [activeTab])

  const handleUpdatePrice = async () => {
    if (!newBuyRate || !newSellRate) {
      return
    }

    try {
      await updateRates(activeTab as 'UPI' | 'CDM', newBuyRate, newSellRate)
      await refetch() // Refresh rates
      setNewBuyRate('')
      setNewSellRate('')
      setUpdateSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update rates:', error)
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

        {/* Current Rates */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1 font-montserrat">Current Buy Rate</div>
            <div className="text-3xl font-bold text-white font-montserrat">{currentBuyRate} ₹</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1 font-montserrat">Current Sell Rate</div>
            <div className="text-3xl font-bold text-white font-montserrat">{currentSellRate} ₹</div>
          </div>
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
                  {activeTab} rates updated successfully!
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
              <span>Updating...</span>
            </div>
          ) : (
            'Update Price'
          )}
        </button>
      </div>

      {/* User Info Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">User Info</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-montserrat">0xA78B65-E91b2a2</span>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-1 rounded text-sm font-medium transition-all font-montserrat">
            BAN
          </button>
        </div>
      </div>

      {/* User Bank & UPI Details Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">User Bank & UPI Details</h3>
        
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
                <span className="text-white text-sm font-montserrat flex-1">user@paytm</span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">Verification Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-500 text-sm font-montserrat">Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details */}
        {userDetailsTab === 'BANK' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">Account Number</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                <span className="text-white text-sm font-montserrat flex-1">****1234</span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">IFSC CODE</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                <span className="text-white text-sm font-montserrat flex-1">HDFC0001234</span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">Bank Name</span>
              </div>
              <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                <span className="text-white text-sm font-montserrat">HDFC Bank</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">Branch Name</span>
              </div>
              <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                <span className="text-white text-sm font-montserrat">Mumbai Central</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-sm font-montserrat">Account Holder Name</span>
              </div>
              <div className="bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4">
                <span className="text-white text-sm font-montserrat">John Doe</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment section for UPI */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">Payment section for UPI</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-white" />
              <span className="text-gray-400 text-sm font-montserrat">Add Admin UPI ID here</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
              placeholder="Enter UPI ID"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm font-montserrat">Add custom Amount to pay</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-montserrat">₹</span>
              <input
                type="text"
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
                placeholder=""
              />
            </div>
          </div>

          <button className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-2 px-6 rounded-md font-medium transition-all font-montserrat">
            Confirm
          </button>
        </div>
      </div>

      {/* Payment section for CDM */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4 font-montserrat">Payment section for CDM</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm font-montserrat">Account Number</span>
            </div>
            <input
              type="text"
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
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20 font-montserrat"
              placeholder="Enter branch name"
            />
          </div>

          <button className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-2 px-6 rounded-md font-medium transition-all font-montserrat">
            Confirm
          </button>

          <div className="mt-6">
            <h4 className="text-gray-400 text-sm mb-3 font-montserrat">Payment Receipt (CDM)</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-montserrat">Document-4508</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-montserrat">Document-4509</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-montserrat">Document-4510</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
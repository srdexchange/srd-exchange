'use client'

import { useState } from 'react'
import { User, FileText } from 'lucide-react'

export default function AdminRight() {
  const [activeTab, setActiveTab] = useState('UPI')
  const [currentBuyRate, setCurrentBuyRate] = useState('91.5')
  const [currentSellRate, setCurrentSellRate] = useState('91.8')
  const [newBuyRate, setNewBuyRate] = useState('')
  const [newSellRate, setNewSellRate] = useState('')

  return (
    <div className="bg-[#141414] text-white h-full py-4 px-2 space-y-6 overflow-y-auto">
      {/* Rate Management Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        {/* Tab Buttons */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => setActiveTab('UPI')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'UPI'
                ? 'bg-[#622DBF] text-white'
                : 'bg-[#101010] text-gray-300 border border-[#3E3E3E] hover:bg-gray-700/50'
            }`}
          >
            UPI
          </button>
          <button
            onClick={() => setActiveTab('CDM')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
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
          <h2 className="text-xl font-semibold text-white mb-1">Rate Management</h2>
          <p className="text-gray-400 text-sm">Update Buy and Sell rates for USDT</p>
        </div>

        {/* Current Rates */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1">Current Buy Rate</div>
            <div className="text-3xl font-bold text-white">{currentBuyRate} ₹</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-sm mb-1">Current Sell Rate</div>
            <div className="text-3xl font-bold text-white">{currentSellRate} ₹</div>
          </div>
        </div>

        {/* New Rates Input */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <div className="text-gray-400 text-sm mb-2">New Buy Rate</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="text"
                value={newBuyRate}
                onChange={(e) => setNewBuyRate(e.target.value)}
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
                placeholder=""
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-400 text-sm mb-2">New Sell Rate</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="text"
                value={newSellRate}
                onChange={(e) => setNewSellRate(e.target.value)}
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Update Price Button */}
        <button className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-3 px-6 rounded-md font-bold transition-all shadow-lg shadow-purple-600/25">
          Update Price
        </button>
      </div>

      {/* User Info Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4">User Info</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-white" />
            <span className="text-white text-sm">0xA78B65-E91b2a2 (1)</span>
          </div>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-1 rounded text-sm font-medium transition-all">
            BAN
          </button>
        </div>
      </div>

      {/* User Bank & UPI Details Section */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4">User Bank & UPI Details</h3>
        
        {/* Tab Buttons */}
        <div className="flex space-x-3 mb-4">
          <button className="bg-[#1E1C1C] text-gray-400 py-2 px-4 rounded text-sm border border-gray-600/50">
            USER UPI ID
          </button>
          <button className="bg-[#622DBF] text-white py-2 px-4 rounded text-sm font-medium">
            USER BANK DETAILS
          </button>
        </div>

        {/* Bank Details Form */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Account Number</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">IFSC CODE</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter IFSC code"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Branch Name</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter branch name"
            />
          </div>
        </div>
      </div>

      {/* Payment section for UPI */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Payment section for UPI</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-white" />
              <span className="text-gray-400 text-sm">Add Admin UPI ID here</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter UPI ID"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Add custom Amount to pay</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="text"
                className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 pl-7 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
                placeholder=""
              />
            </div>
          </div>

          <button className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-2 px-6 rounded-md font-medium transition-all">
            Confirm
          </button>
        </div>
      </div>

      {/* Payment section for CDM */}
      <div className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Payment section for CDM</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Account Number</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">IFSC CODE</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter IFSC code"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Branch Name</span>
            </div>
            <input
              type="text"
              className="w-full bg-[#1E1C1C] border border-gray-600/50 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#622DBF] focus:ring-1 focus:ring-purple-500/20"
              placeholder="Enter branch name"
            />
          </div>

          <button className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-2 px-6 rounded-md font-medium transition-all">
            Confirm
          </button>

          <div className="mt-6">
            <h4 className="text-gray-400 text-sm mb-3">Payment Receipt (CDM)</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Document-4508</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Document-4509</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Document-4510</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
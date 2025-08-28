'use client'

import { Copy, User, ExternalLink, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletManager } from '@/hooks/useWalletManager'
import { useUserOrders } from '@/hooks/useUserOrders'
import { useRates } from '@/hooks/useRates'
import BuyCDMModal from './modal/buy-cdm'
import BuyUPIModal from './modal/buy-upi'
import SellUPIModal from './modal/sell-upi'
import SellCDMModal from './modal/sell-cdm'

export default function BuySellSection() {
  const [activeTab, setActiveTab] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [showBuyCDMModal, setShowBuyCDMModal] = useState(false)
  const [showBuyUPIModal, setShowBuyUPIModal] = useState(false)
  const [showSellUPIModal, setShowSellUPIModal] = useState(false)
  const [showSellCDMModal, setShowSellCDMModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Wallet and orders data
  const { 
    address, 
    isConnected, 
    walletData, 
    isLoading: walletLoading, 
    refetchBalances 
  } = useWalletManager()
  
  const { 
    orders, 
    isLoading: ordersLoading, 
    refetch: refetchOrders 
  } = useUserOrders()

  // Get dynamic rates
  const { getBuyRate, getSellRate, loading: ratesLoading } = useRates()

  // Get rates based on payment method (default to UPI)
  const currentPaymentMethod = paymentMethod === 'cdm' ? 'CDM' : 'UPI'
  const buyPrice = getBuyRate(currentPaymentMethod)
  const sellPrice = getSellRate(currentPaymentMethod)

  // Helper functions
  const calculateUSDT = (rupeeAmount: string) => {
    const numericAmount = parseFloat(rupeeAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) return '0'
    const usdtAmount = numericAmount / buyPrice
    return usdtAmount.toFixed(2)
  }

  const calculateRupee = (usdtAmount: string) => {
    const numericAmount = parseFloat(usdtAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) return '0'
    const rupeeAmount = numericAmount * sellPrice
    return rupeeAmount.toFixed(2)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetchBalances(), refetchOrders()])
  }

  const usdtAmount = calculateUSDT(amount)
  const rupeeAmount = calculateRupee(amount)

  const getPaymentMethodName = () => {
    switch(paymentMethod) {
      case 'upi': return 'UPI'
      case 'cdm': return 'CDM'
      default: return ''
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPaymentMethod('')
    setAmount('')
  }

  // Create order function
  const createOrder = async (orderType: string, orderAmount: string, rate: number) => {
    if (!address) return null

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          orderType: orderType,
          amount: orderAmount,
          usdtAmount: orderType.includes('BUY') ? usdtAmount : amount,
          buyRate: orderType.includes('BUY') ? rate : null,
          sellRate: orderType.includes('SELL') ? rate : null,
          paymentMethod: paymentMethod.toUpperCase()
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh orders after successful creation
        await refetchOrders()
        return data.order
      } else {
        throw new Error(data.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
      return null
    }
  }

  const handleBuySellClick = async () => {
    if (!isConnected || !amount || parseFloat(amount) <= 0) return

    setIsPlacingOrder(true)

    try {
      let orderType = ''
      let orderAmount = amount
      let rate = 0

      if (activeTab === 'buy') {
        orderType = paymentMethod === 'cdm' ? 'BUY_CDM' : 'BUY_UPI'
        rate = buyPrice
      } else {
        orderType = 'SELL'
        rate = sellPrice
      }

      const order = await createOrder(orderType, orderAmount, rate)

      if (order) {
        // Refresh orders after successful creation
        await refetchOrders()
        
        // Reset form
        setAmount('')
        
        console.log('Order created successfully:', order)
        
        // Show appropriate modal with the created order
        if (activeTab === 'buy' && paymentMethod === 'cdm') {
          setShowBuyCDMModal(true)
        } else if (activeTab === 'buy' && paymentMethod === 'upi') {
          setShowBuyUPIModal(true)
        } else if (activeTab === 'sell' && paymentMethod === 'upi') {
          setShowSellUPIModal(true)
        } else if (activeTab === 'sell' && paymentMethod === 'cdm') {
          setShowSellCDMModal(true)
        }
      }
    } catch (error) {
      console.error('Error in buy/sell click:', error)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <>
      <div className="bg-black text-white h-full flex items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="w-full space-y-4">
          {/* Enhanced Wallet Balance Card */}
          <motion.div 
            className="bg-[#101010] max-w-md border border-[#3E3E3E] rounded-md p-4 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isConnected && address ? (
              <div className="space-y-3">
                {/* Wallet Address */}
                <div className="flex justify-center items-center space-x-2 mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#622DBF]/20 flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#622DBF]"/>
                  </div>
                  <span className="text-xs sm:text-sm text-white font-medium">
                    {formatAddress(address)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className='w-3 h-3 sm:w-4 sm:h-4'/>
                  </button>
                  <a
                    href={`https://bscscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>

                {copied && (
                  <motion.div
                    className="text-center text-green-400 text-xs"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    Address copied!
                  </motion.div>
                )}

                {/* Balance Display */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className="text-xs text-white">Available Balance</span>
                    <button
                      onClick={handleRefresh}
                      disabled={walletLoading}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${walletLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {walletLoading ? (
                    <div className="text-lg sm:text-xl font-bold text-gray-400">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {walletData?.balances.usdt 
                          ? `${parseFloat(walletData.balances.usdt.formatted).toFixed(2)} USDT`
                          : '0.00 USDT'
                        }
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center justify-center space-x-1">
                        <span>≈</span>
                        <span>
                          ₹{walletData?.balances.usdt 
                            ? (parseFloat(walletData.balances.usdt.formatted) * buyPrice).toFixed(2)
                            : '0.00'
                          }
                        </span>
                      </div>
                      
                      {/* BNB Gas Balance */}
                      <div className="text-xs text-gray-500 mt-2">
                        Gas: {walletData?.balances.bnb 
                          ? `${parseFloat(walletData.balances.bnb.formatted).toFixed(4)} BNB`
                          : '0.0000 BNB'
                        }
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between text-center pt-3 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400">Total Orders</div>
                    <div className="text-sm font-medium text-white">
                      {ordersLoading ? '...' : orders.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-sm font-medium text-green-400">
                      {ordersLoading ? '...' : orders.filter(o => o.status === 'COMPLETED').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Pending</div>
                    <div className="text-sm font-medium text-yellow-400">
                      {ordersLoading ? '...' : orders.filter(o => ['PENDING', 'ADMIN_APPROVED', 'PAYMENT_SUBMITTED'].includes(o.status)).length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center items-center space-x-2 sm:space-x-3 mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5"/>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">
                    Connect wallet to view balance
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Available Balance</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-500">-- USDT</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Price Display - Centered */}
          <motion.div 
            className="flex justify-center max-w-md space-x-3 sm:space-x-6 mx-auto mb-6 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="border border-[#3E3E3E] rounded-lg p-3 sm:p-4 min-w-[100px] sm:min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <img src="/buy.svg" alt="" className='w-4 h-4 sm:w-5 sm:h-5'/>
                <span className="text-xs sm:text-sm text-white">Buy Price</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-center">
                {ratesLoading ? '...' : `${buyPrice} ₹`}
              </div>
            </div>
            <div className="border border-[#3E3E3E] rounded-md py-3 sm:py-4 px-2 min-w-[100px] sm:min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <img src="/sell.svg" alt="" className='w-4 h-4 sm:w-5 sm:h-5'/>
                <span className="text-xs sm:text-sm text-white">Sell Price</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-center">
                {ratesLoading ? '...' : `${sellPrice} ₹`}
              </div>
            </div>
          </motion.div>

          {/* Buy/Sell Tabs */}
          <motion.div 
            className="flex space-x-3 sm:space-x-6 max-w-lg mx-auto mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.button
              onClick={() => handleTabChange('buy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 sm:py-4 px-6 sm:px-12 rounded-md font-semibold text-base sm:text-lg transition-all ${
                activeTab === 'buy'
                  ? 'bg-[#622DBF] text-white shadow-lg shadow-purple-600/25'
                  : 'bg-[#101010] text-white border border-[#3E3E3E] hover:bg-gray-700/50'
              }`}
            >
              Buy
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('sell')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 sm:py-4 px-6 sm:px-12 rounded-md font-semibold text-base sm:text-lg transition-all ${
                activeTab === 'sell' 
                  ? 'bg-[#622DBF] text-white shadow-lg shadow-purple-600/25' 
                  : 'bg-[#101010] text-white border border-[#3E3E3E] hover:bg-gray-700/50'
              }`}>
              Sell
            </motion.button>
          </motion.div>

          {/* Payment Method Selection */}
          <AnimatePresence>
            {activeTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/30 border border-[#3E3E3E] rounded-md p-4 sm:p-5 mb-6 sm:mb-8 overflow-hidden"
              >
                <h3 className="text-lg sm:text-xl mb-2 text-white">Select how you'd like to {activeTab === 'buy' ? 'pay' : 'receive payment'}</h3>
                <div className="space-y-3 sm:space-y-4">
                  <motion.label 
                    className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all ${
                        paymentMethod === 'upi' 
                          ? 'bg-[#622DBF] border-[#622DBF]' 
                          : 'bg-[#1E1C1C] border-[#3E3E3E]'
                      }`}
                      onClick={() => setPaymentMethod('upi')}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence>
                        {paymentMethod === 'upi' && (
                          <motion.svg 
                            className="w-3 h-3 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img src="/phonepay-gpay.svg" alt="" className="w-6 h-6" />
                      <span className="text-sm sm:text-base font-medium group-hover:text-white transition-colors">
                        {activeTab === 'buy' ? 'Pay with UPI' : 'Receive via UPI'}
                      </span>
                    </div>
                  </motion.label>
                  <motion.label 
                    className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all ${
                        paymentMethod === 'cdm' 
                          ? 'bg-[#622DBF] border-[#622DBF]' 
                          : 'bg-[#1E1C1C] border-[#3E3E3E]'
                      }`}
                      onClick={() => setPaymentMethod('cdm')}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence>
                        {paymentMethod === 'cdm' && (
                          <motion.svg 
                            className="w-3 h-3 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img src="/bank.svg" alt="" className='w-5 h-5 sm:w-6 sm:h-6' />
                      <span className="text-sm sm:text-base font-medium group-hover:text-white transition-colors">
                        {activeTab === 'buy' ? 'Cash Deposit (CDM)' : 'Cash Withdrawal (CDM)'}
                      </span>
                    </div>
                  </motion.label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Amount Input Section */}
          <AnimatePresence>
            {activeTab && paymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4 sm:p-5"
              >
                <div className="flex justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-5">
                  <img src={paymentMethod === 'upi' ? "/phonepay-gpay.svg" : "/bank.svg"} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-md text-gray-300 text-center">
                    You are {activeTab === 'buy' ? 'buying' : 'selling'} via {getPaymentMethodName()}
                  </span>
                </div>
                
                <div className="relative mb-4 sm:mb-6 flex justify-center">
                  <span className="absolute left-3 sm:left-65 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl sm:text-3xl">
                    {activeTab === 'buy' ? '₹' : activeTab === 'sell' ? '$' : '₹'}
                  </span>
                  <motion.input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#1E1C1C] border border-gray-600/50 rounded-xl py-4 sm:py-5 pl-10 sm:pl-12 pr-4 text-xl sm:text-2xl font-medium focus:outline-none focus:border-[#622DBF] focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 w-full max-w-xs"
                    placeholder="0"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <motion.svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none" 
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: amount ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </motion.svg>
                </div>

                <motion.div 
                  className="text-center"
                  key={activeTab === 'buy' ? usdtAmount : rupeeAmount}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    {activeTab === 'buy' ? `${usdtAmount} USDT` : `₹${rupeeAmount}`}
                  </div>
                  <div className="text-sm text-white">
                    {activeTab === 'buy' 
                      ? 'will be credited to your account'
                      : 'will be transferred to your account'
                    }
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <AnimatePresence>
            {activeTab && paymentMethod && (
              <motion.button 
                onClick={handleBuySellClick}
                disabled={!isConnected || isPlacingOrder || !amount || parseFloat(amount) <= 0}
                className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-4 sm:py-5 px-6 rounded-xl font-bold text-lg sm:text-xl transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: (!isConnected || isPlacingOrder) ? 1 : 1.02 }}
                whileTap={{ scale: (!isConnected || isPlacingOrder) ? 1 : 0.98 }}
                transition={{ duration: 0.3 }}
              >
                {!isConnected 
                  ? 'Connect Wallet to Trade'
                  : isPlacingOrder
                  ? `Placing ${activeTab === 'buy' ? 'Buy' : 'Sell'} Order...`
                  : `${activeTab === 'buy' ? 'Buy' : 'Sell'}`
                }
              </motion.button>
            )}
          </AnimatePresence>

          {/* How to buy/sell link */}
          <AnimatePresence>
            {activeTab && (
              <motion.div 
                className="text-center pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button 
                  className="flex items-center space-x-2 text-white hover:text-white transition-colors mx-auto group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    whileHover={{ rotate: 15 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                  <span className="font-medium text-sm sm:text-base">How to {activeTab}?</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <BuyCDMModal 
        isOpen={showBuyCDMModal}
        onClose={() => setShowBuyCDMModal(false)}
        amount={amount}
        usdtAmount={usdtAmount}
      />

      <BuyUPIModal 
        isOpen={showBuyUPIModal}
        onClose={() => setShowBuyUPIModal(false)}
        amount={amount}
        usdtAmount={usdtAmount}
      />

      <SellUPIModal 
        isOpen={showSellUPIModal}
        onClose={() => setShowSellUPIModal(false)}
        usdtAmount={amount}
        amount={rupeeAmount}
      />

      <SellCDMModal 
        isOpen={showSellCDMModal}
        onClose={() => setShowSellCDMModal(false)}
        usdtAmount={amount}
        amount={rupeeAmount}
      />
    </>
  )
}
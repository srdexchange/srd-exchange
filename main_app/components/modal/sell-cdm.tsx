"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  TriangleAlert,
  CreditCard,
  Clock,
  Check,
  CheckCheck,
  CircleQuestionMark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBankDetails } from '@/hooks/useBankDetails';
import { useModalState } from "@/hooks/useModalState";
import { useWalletManager } from '@/hooks/useWalletManager';
import { useRates } from '@/hooks/useRates';

interface SellCDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  usdtAmount: string;
  amount: string;
  orderData?: any;
}

export default function SellCDMModal({
  isOpen,
  onClose,
  usdtAmount,
  amount,
  orderData,
}: SellCDMModalProps) {
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isMoneyReceived, setIsMoneyReceived] = useState(false);
  const [isCoinSent, setIsCoinSent] = useState(false);
  const { bankDetails } = useBankDetails();
  const [accountNumber, setAccountNumber] = useState("");
  
  const { saveModalState, getModalState, clearModalState } = useModalState();
  const { completeSellOrderOnChain } = useWalletManager();
  const { getSellRate, loading: ratesLoading } = useRates();

  // Calculate display amounts using proper API rates
  let displayUsdtAmount = '';
  let displayRupeeAmount = '';
  let currentRate = 0;
  let paymentMethod = 'CDM'; // Default for this modal

  // Determine payment method from order data if available
  if (orderData?.orderType) {
    if (orderData.orderType.includes('CDM')) {
      paymentMethod = 'CDM';
    } else if (orderData.orderType.includes('UPI')) {
      paymentMethod = 'UPI';
    }
  }


  const calculateRupeeFromUSDT = (usdtAmount: string, sellRate: number) => {
    const numericAmount = parseFloat(usdtAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) return '0'
    // For selling: USDT * sell_rate = rupees
    const rupeeAmount = numericAmount * sellRate
    return rupeeAmount.toFixed(2)
  }

  if (orderData) {
    if (orderData.orderType && orderData.orderType.includes('SELL')) {
      // For sell orders from database: orderData.usdtAmount is what user is selling
      displayUsdtAmount = orderData.usdtAmount ? orderData.usdtAmount.toString() : usdtAmount || '0';
      
      // Get the current sell rate from API - same logic as buysellSection.tsx
      const currentPaymentMethod = paymentMethod === 'CDM' ? 'CDM' : 'UPI';
      currentRate = getSellRate ? getSellRate(currentPaymentMethod) : (paymentMethod === 'CDM' ? 92.0 : 92.5);
      
      // Calculate rupees using the same method as buysellSection.tsx
      if (orderData.usdtAmount && currentRate > 0) {
        displayRupeeAmount = calculateRupeeFromUSDT(orderData.usdtAmount.toString(), currentRate);
      } else {
        displayRupeeAmount = amount || '0';
      }
        
      console.log('📊 CDM Sell Modal - Calculated amounts:', {
        displayUsdtAmount,
        displayRupeeAmount,
        currentRate,
        paymentMethod,
        orderType: orderData.orderType,
        apiRate: currentRate,
        getSellRateExists: !!getSellRate
      });
    } else {
      // Fallback to props
      displayUsdtAmount = usdtAmount || '0';
      displayRupeeAmount = amount || '0';
      const usdtNum = parseFloat(usdtAmount || '1');
      const amountNum = parseFloat(amount || '0');
      currentRate = usdtNum > 0 ? amountNum / usdtNum : 92.0;
    }
  } else {
    // No order data, use props (user just entered values from buysellSection)
    displayUsdtAmount = usdtAmount || '0'; // User entered USDT
    displayRupeeAmount = amount || '0';     // Already calculated in buysellSection
    
    // Get current rate for display
    const currentPaymentMethod = 'CDM';
    currentRate = getSellRate ? getSellRate(currentPaymentMethod) : 92.0;
  }

  // Ensure currentRate is always a valid number
  if (!currentRate || typeof currentRate !== 'number' || isNaN(currentRate) || currentRate <= 0) {
    currentRate = paymentMethod === 'CDM' ? 92.0 : 92.5;
    console.warn('Invalid currentRate, using fallback:', currentRate);
  }

  useEffect(() => {
    if (isOpen && orderData) {
      console.log('📂 Loading SELL CDM modal state for order:', orderData.fullId || orderData.id);
      const savedState = getModalState(orderData.fullId || orderData.id);
      if (savedState) {
        console.log('📋 Restoring SELL CDM modal state:', savedState);
        
        if (savedState.currentStep >= 2) {
          setIsMoneyReceived(true);
          setIsWaitingConfirmation(true);
        } else if (savedState.currentStep >= 1) {
          setIsWaitingConfirmation(true);
          setIsMoneyReceived(false);
        } else {
          setIsWaitingConfirmation(false);
          setIsMoneyReceived(false);
        }
      } else {
        console.log('🆕 No saved SELL CDM state found, starting fresh');
        setIsWaitingConfirmation(false);
        setIsMoneyReceived(false);
      }
    }
  }, [isOpen, orderData]);

  useEffect(() => {
    if (orderData && isOpen) {
      const currentStep = isMoneyReceived ? 2 : isWaitingConfirmation ? 1 : 0;
      
      console.log('💾 Saving SELL CDM modal state:', {
        orderId: orderData.fullId || orderData.id,
        currentStep
      });
      
      saveModalState(
        orderData.fullId || orderData.id,
        'SELL_CDM',
        currentStep,
        { accountNumber },
        null
      );
    }
  }, [isWaitingConfirmation, isMoneyReceived, orderData, isOpen, accountNumber]);

  useEffect(() => {
    if (isOpen && !orderData) {
      console.log('🔄 Resetting SELL CDM modal state for new order');
      setIsWaitingConfirmation(false);
      setIsMoneyReceived(false);
      setAccountNumber("");
    }
  }, [isOpen, orderData]);

  useEffect(() => {
    if (bankDetails?.accountNumber && !accountNumber) {
      setAccountNumber(bankDetails.accountNumber);
    }
  }, [bankDetails, accountNumber]);

  const handleWaitingConfirmation = () => {
    setIsWaitingConfirmation(true);
    console.log("✅ Waiting for confirmation clicked");
  };

  const handleMoneyReceived = async () => {
    try {
      console.log('🔗 Completing sell order on blockchain...');
      if (orderData?.blockchainOrderId) {
        await completeSellOrderOnChain(parseInt(orderData.blockchainOrderId));
      }
      setIsMoneyReceived(true);
      setIsCoinSent(true);
      
      // 🔥 ADD: Broadcast event to admin center
      if (orderData) {
        window.dispatchEvent(new CustomEvent('userReceivedMoney', {
          detail: {
            orderId: orderData.fullId || orderData.id,
            orderType: orderData.orderType,
            amount: displayRupeeAmount,
            timestamp: new Date().toISOString()
          }
        }));
        
        console.log('📢 Broadcasted user money received event:', {
          orderId: orderData.fullId || orderData.id,
          amount: displayRupeeAmount
        });
      }
      
      console.log("💰 Money Received on Account clicked");
    } catch (error) {
      console.error('❌ Error completing sell order on blockchain:', error);
      setIsMoneyReceived(true);
      setIsCoinSent(true);
      
      // Still broadcast event even if blockchain operation fails
      if (orderData) {
        window.dispatchEvent(new CustomEvent('userReceivedMoney', {
          detail: {
            orderId: orderData.fullId || orderData.id,
            orderType: orderData.orderType,
            amount: displayRupeeAmount,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }
  };

  const handleOrderComplete = () => {
    if (orderData) {
      clearModalState(orderData.fullId || orderData.id);
    }
    onClose();
  };

  const orderDisplayId = orderData ? `Order ${orderData.id || orderData.fullId?.slice(-6) || '14'}` : 'Order 14';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-4 md:p-4 pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111010] rounded-t-xl md:rounded-xl max-w-4xl w-full relative overflow-hidden max-h-[90vh] md:max-h-[90vh]"
            initial={{
              scale:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 1
                  : 0.9,
              opacity:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 1
                  : 0,
              y:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? "100%"
                  : 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 1
                  : 0.9,
              opacity:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 1
                  : 0,
              y:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? "100%"
                  : 0,
            }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#2F2F2F]">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isMoneyReceived ? "bg-gray-400" : isWaitingConfirmation ? "bg-green-400" : "bg-yellow-400"
                }`}></div>
                <span className="text-white font-medium">{orderDisplayId}</span>
              </div>

              <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-1 justify-center items-center text-white text-sm">
                <CircleQuestionMark className="w-5 h-5" />
                <span>How to sell?</span>
              </div>

              <button onClick={onClose} className="text-white hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>


            <div className="overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[calc(90vh-80px)]">
              <div className="p-4 text-center">
           
                <div className="mb-6">
               
                  <div className="text-4xl md:text-4xl font-bold text-white mb-2">
                    {parseFloat(displayUsdtAmount).toFixed(4)} USDT
                  </div>
                  
                 
                  <div className="text-2xl md:text-2xl font-medium text-green-400 mb-2">
                    You'll receive ₹{parseFloat(displayRupeeAmount).toFixed(2)}
                  </div>
               

                  <div className="text-xs text-gray-400 mb-2">
                    Selling {parseFloat(displayUsdtAmount).toFixed(4)} USDT • Getting ₹{parseFloat(displayRupeeAmount).toFixed(2)} INR
                  </div>
                  

                  <div className="text-xs text-gray-500 mb-2">
                    {ratesLoading ? (
                      'Loading rate...'
                    ) : (
                      <>
                        Rate: ₹{currentRate.toFixed(2)} per USDT ({paymentMethod})
                        <span className="ml-2 text-blue-400">(Current API rate)</span>
                      </>
                    )}
                  </div>
                  
                 
                  
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-white mt-2 mb-4">{paymentMethod} Sell Order</div>
                </div>

                {/* Payment Method Badge */}
                <div className="flex items-center justify-center space-x-4 md:space-x-10 mb-6 flex-wrap gap-2">
                  <div className="bg-[#1D1C1C] text-black px-2 py-1 rounded text-sm font-medium flex items-center space-x-2">
                    <img src={paymentMethod === 'CDM' ? "/bank.svg" : "/phonepay-gpay.svg"} alt="" className="w-5 h-5" />
                    <span className="text-white">{paymentMethod}</span>
                  </div>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    Sell Order
                  </span>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    {orderData ? new Date(orderData.createdAt || Date.now()).toLocaleTimeString() : 'Today'}
                  </span>
                </div>

                {/* Order Status Information */}
                {orderData && (
                  <div className="mb-6 p-3 rounded-lg">
                    <div className="text-sm text-blue-400 font-medium mb-1">
                      Order Status: {orderData.status || 'PENDING'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {orderData.orderType} • Selling: {parseFloat(displayUsdtAmount).toFixed(4)} USDT → Receiving: ₹{parseFloat(displayRupeeAmount).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Payment Method: {paymentMethod} • Rate: ₹{currentRate.toFixed(2)}/USDT
                    </div>
                  </div>
                )}

                {/* Enhanced Progress Bar Messages */}
                {isMoneyReceived && (
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-60 md:w-80 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full w-full"></div>
                    </div>
                    <div className="text-green-400 text-sm font-medium mt-1">
                      ✅ Payment confirmed! {parseFloat(displayUsdtAmount).toFixed(4)} USDT sent to admin
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      You received ₹{parseFloat(displayRupeeAmount).toFixed(2)} via {paymentMethod}
                    </div>
                  </div>
                )}

                <div className="px-4 md:px-0">
                  {isWaitingConfirmation && !isMoneyReceived && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-sm text-red-400 font-medium text-center">
                        ⚠️ By clicking "I Confirm," you Release USDT and Received INR. No reversal after this!
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={
                      isMoneyReceived
                        ? handleOrderComplete
                        : isWaitingConfirmation
                        ? handleMoneyReceived
                        : handleWaitingConfirmation
                    }
                    className="w-full py-3 rounded-lg font-bold text-white transition-all bg-[#622DBF] hover:bg-purple-700"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isMoneyReceived ? (
                        <>
                          <CheckCheck className="w-5 h-5" />
                          <span>Order Complete</span>
                        </>
                      ) : isWaitingConfirmation ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>I Confirm, INR Received</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5" />
                          <span>Waiting for Confirmation</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

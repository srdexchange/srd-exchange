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

interface SellCDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  usdtAmount: string;
  amount: string;
  orderData?: any; // Add this prop
}

export default function SellCDMModal({
  isOpen,
  onClose,
  usdtAmount,
  amount,
  orderData, // Add this parameter
}: SellCDMModalProps) {
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isMoneyReceived, setIsMoneyReceived] = useState(false);
  const { bankDetails } = useBankDetails();
  const [accountNumber, setAccountNumber] = useState("");
  
  const { saveModalState, getModalState, clearModalState } = useModalState();

  // Load saved state when modal opens
  useEffect(() => {
    if (isOpen && orderData) {
      console.log('📂 Loading SELL CDM modal state for order:', orderData.fullId || orderData.id);
      const savedState = getModalState(orderData.fullId || orderData.id);
      if (savedState) {
        console.log('📋 Restoring SELL CDM modal state:', savedState);
        
        // Restore the step states based on saved data
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
        // No saved state, start fresh
        console.log('🆕 No saved SELL CDM state found, starting fresh');
        setIsWaitingConfirmation(false);
        setIsMoneyReceived(false);
      }
    }
  }, [isOpen, orderData]);

  // Save state whenever it changes
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

  // Reset modal state when opened without orderData
  useEffect(() => {
    if (isOpen && !orderData) {
      console.log('🔄 Resetting SELL CDM modal state for new order');
      setIsWaitingConfirmation(false);
      setIsMoneyReceived(false);
      setAccountNumber("");
    }
  }, [isOpen, orderData]);

  // Auto-fill account number from saved bank details
  useEffect(() => {
    if (bankDetails?.accountNumber && !accountNumber) {
      setAccountNumber(bankDetails.accountNumber);
    }
  }, [bankDetails, accountNumber]);

  const handleWaitingConfirmation = () => {
    setIsWaitingConfirmation(true);
    console.log("✅ Waiting for confirmation clicked");
  };

  const handleMoneyReceived = () => {
    setIsMoneyReceived(true);
    console.log("💰 Money Received on Account clicked");
  };

  const handleOrderComplete = () => {
    if (orderData) {
      clearModalState(orderData.fullId || orderData.id);
    }
    onClose();
  };

  // Get order ID for display
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
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMoneyReceived
                      ? "bg-gray-400"
                      : isWaitingConfirmation
                      ? "bg-green-400"
                      : "bg-yellow-400"
                  }`}
                ></div>
                <span className="text-white font-medium">{orderDisplayId}</span>
              </div>

              {/* Desktop - Centered "How to sell" */}
              <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-1 justify-center items-center text-white text-sm">
                <CircleQuestionMark className="w-5 h-5" />
                <span>How to sell?</span>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="text-white hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[calc(90vh-80px)]">
              <div className="p-4 text-center">
                {/* Amount Display */}
                <div className="mb-6">
                  <div className="text-4xl md:text-4xl font-bold text-white mb-2">
                    {usdtAmount} USDT
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
                  <div className="text-xs text-white mt-2 mb-4">{amount}₹</div>
                </div>

                {/* Payment Method Badge */}
                <div className="flex items-center justify-center space-x-4 md:space-x-10 mb-6 flex-wrap gap-2">
                  <div className="bg-[#1D1C1C] text-black px-2 py-1 rounded text-sm font-medium flex items-center space-x-2">
                    <img src="/bank.svg" alt="" className="w-5 h-5" />
                    <span className="text-white">CDM</span>
                  </div>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    Sell Order
                  </span>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    {orderData ? new Date(orderData.createdAt || Date.now()).toLocaleTimeString() : 'Today 11:40 PM'}
                  </span>
                </div>

                {/* Your Bank Details */}
                <div className="mb-6">
                  {bankDetails ? (
                    <div className="bg-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Your Bank Account</span>
                        <span className="text-green-400 text-xs">✓ Saved</span>
                      </div>
                      <div className="text-white font-medium text-lg">
                        {bankDetails.accountHolderName}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {bankDetails.accountNumber} • {bankDetails.ifscCode}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {bankDetails.branchName}
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Add your Account Number"
                      className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>

                {/* Progress Bar - Centered - Hide when waiting confirmation or money received */}
                {!isWaitingConfirmation && !isMoneyReceived && (
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-60 md:w-80 bg-gray-700 rounded-full h-2 mb-2">
                      <div className="bg-[#622DBF] h-2 rounded-full w-3/4"></div>
                    </div>
                    <div className="text-white text-sm font-medium">
                      14 : 34 Left
                    </div>
                  </div>
                )}

                {/* Show progress bar and message when order is complete */}
                {isMoneyReceived && (
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-60 md:w-80 bg-gray-700 rounded-full h-2 mb-2">
                      <div className="bg-[#622DBF] h-2 rounded-full w-full"></div>
                    </div>
          
                    <div className="text-white text-sm font-medium mt-1">
                      Money paid to account please check and confirm
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="px-4 md:px-0">
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
                          <span>Money Received on Account</span>
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

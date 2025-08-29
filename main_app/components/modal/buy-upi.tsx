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
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
  
interface BuyUPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  usdtAmount: string;
}

interface AdminPaymentDetails {
  orderId: string;
  customAmount: number;
  paymentMethod: string;
  adminUpiId: string | null;
  adminBankDetails: any;
}

export default function BuyUPIModal({
  isOpen,
  onClose,
  amount,
  usdtAmount,
}: BuyUPIModalProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isCoinReceived, setIsCoinReceived] = useState(false);
  const [adminPaymentDetails, setAdminPaymentDetails] = useState<AdminPaymentDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Listen for admin payment details
  useEffect(() => {
    const handleAdminPaymentDetails = (event: CustomEvent) => {
      console.log('Admin payment details received:', event.detail);
      if (event.detail.paymentMethod === 'BUY_UPI') {
        setAdminPaymentDetails(event.detail);
      }
    };

    window.addEventListener('adminPaymentDetailsSent', handleAdminPaymentDetails as EventListener);

    return () => {
      window.removeEventListener('adminPaymentDetailsSent', handleAdminPaymentDetails as EventListener);
    };
  }, []);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setIsPaid(false);
      setIsWaitingConfirmation(false);
      setIsCoinReceived(false);
      setAdminPaymentDetails(null);
      setCopiedField(null);
    }
  }, [isOpen]);

  // Display logic
  const displayAmount = adminPaymentDetails?.customAmount 
    ? adminPaymentDetails.customAmount.toString() 
    : amount;

  const displayUpiId = adminPaymentDetails?.adminUpiId || "admin@paytm"; // Default admin UPI

  const hasReceivedAdminDetails = !!adminPaymentDetails;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePaymentConfirm = () => {
    setIsWaitingConfirmation(true);
  };

  const handleWaitingConfirmation = () => {
    setIsPaid(true);
    setIsWaitingConfirmation(false);
  };

  const handleCoinReceived = () => {
    setIsCoinReceived(true);
  };

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
              scale: typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 0.9,
              opacity: typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 0,
              y: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 0.9,
              opacity: typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 0,
              y: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 0,
            }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#2F2F2F]">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCoinReceived
                      ? "bg-gray-400"
                      : isPaid
                      ? "bg-green-400"
                      : hasReceivedAdminDetails
                      ? "bg-blue-400"
                      : "bg-yellow-400"
                  }`}
                ></div>
                <span className="text-white font-medium">
                  {hasReceivedAdminDetails ? 'Admin Details Received' : 'Waiting for Admin'}
                </span>
              </div>

              {/* Desktop - Centered "How to buy" */}
              <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-1 justify-center items-center text-white text-sm">
                <CircleQuestionMark className="w-5 h-5" />
                <span>How to buy?</span>
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
                {/* Order Status Messages */}
                {!hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 font-medium">Order Placed Successfully</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Waiting for admin to accept your order and provide payment details
                    </p>
                  </motion.div>
                )}

                {hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Admin Payment Details Received</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Please pay to the admin's UPI ID below
                    </p>
                  </motion.div>
                )}

                {isPaid && (
                  <motion.div
                    className="text-[#26AF6C] text-sm font-medium mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Admin paid you {usdtAmount} USDT
                  </motion.div>
                )}

                {/* Amount Display */}
                <div className="mb-6">
                  <div className="text-4xl md:text-4xl font-bold text-white mb-2">
                    {displayAmount}₹
                  </div>
                  {hasReceivedAdminDetails && displayAmount !== amount && (
                    <div className="text-sm text-green-400 mb-2">
                      (Custom amount set by admin)
                    </div>
                  )}
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
                  <div className="text-xs text-white mt-2 mb-4">
                    {usdtAmount} USDT
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div className="flex items-center justify-center space-x-4 md:space-x-10 mb-6 flex-wrap gap-2">
                  <div className="bg-[#1D1C1C] text-black px-2 py-1 rounded text-sm font-medium flex items-center space-x-2">
                    <img src="/phonepay-gpay.svg" alt="" className="w-5 h-5" />
                    <span className="text-white">UPI</span>
                  </div>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    Buy Order
                  </span>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                {/* Payment Instructions */}
                {hasReceivedAdminDetails && !isWaitingConfirmation && !isPaid && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Please pay {displayAmount}₹ to admin's UPI ID
                    </div>
                    <div className="text-[#26AF6C] text-xs flex items-center justify-center mb-4">
                      <TriangleAlert className="w-3 h-3 mr-1" />
                      Pay only to the admin's UPI ID provided below
                    </div>
                  </div>
                )}

                {!hasReceivedAdminDetails && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Your order is pending admin approval
                    </div>
                    <div className="text-gray-400 text-xs flex items-center justify-center mb-4">
                      <Clock className="w-3 h-3 mr-1" />
                      You will receive payment details once admin accepts your order
                    </div>
                  </div>
                )}

                {/* UPI ID Section */}
                <div className="flex items-center justify-center mb-6">
                  <div className={`flex items-center justify-between rounded-lg px-4 py-3 min-w-[280px] md:min-w-[325px] max-w-md w-full mx-4 ${
                    hasReceivedAdminDetails ? 'bg-[#2a2a2a]' : 'bg-[#2a2a2a]/50 border border-dashed border-gray-600'
                  }`}>
                    <span className={`font-medium text-lg md:text-lg ${
                      hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'
                    }`}>
                      {hasReceivedAdminDetails ? displayUpiId : "Waiting for admin UPI..."}
                    </span>
                    {hasReceivedAdminDetails && (
                      <button
                        onClick={() => handleCopy(displayUpiId, 'upi')}
                        className="text-gray-400 hover:text-white transition-colors ml-4"
                      >
                        {copiedField === 'upi' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-60 md:w-80 bg-gray-700 rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${
                      isCoinReceived ? 'w-full bg-green-500' :
                      isPaid ? 'w-4/5 bg-green-500' :
                      hasReceivedAdminDetails ? 'w-3/5 bg-blue-500' : 'w-1/4 bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="text-white text-sm font-medium">
                    {isCoinReceived ? 'Order Complete' :
                     isPaid ? 'Payment Confirmed' :
                     hasReceivedAdminDetails ? 'Ready for Payment' : 'Waiting for Admin'}
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-4 md:px-0">
                  <button
                    onClick={
                      isCoinReceived
                        ? onClose 
                        : isPaid
                        ? handleCoinReceived
                        : isWaitingConfirmation
                        ? handleWaitingConfirmation
                        : hasReceivedAdminDetails
                        ? handlePaymentConfirm
                        : undefined
                    }
                    disabled={!hasReceivedAdminDetails && !isPaid && !isCoinReceived}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      hasReceivedAdminDetails || isPaid || isCoinReceived
                        ? 'bg-[#622DBF] hover:bg-purple-700 cursor-pointer'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isCoinReceived ? (
                        <>
                          <CheckCheck className="w-5 h-5" />
                          <span>Order Complete</span>
                        </>
                      ) : isPaid ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Coin Received in Wallet</span>
                        </>
                      ) : isWaitingConfirmation ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          <span>Waiting for confirmation</span>
                        </>
                      ) : hasReceivedAdminDetails ? (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>I Paid {displayAmount}₹ To Admin</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 animate-pulse" />
                          <span>Waiting for Admin Approval</span>
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

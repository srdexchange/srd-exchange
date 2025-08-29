"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  TriangleAlert,
  CreditCard,
  Clock,
  Upload,
  FileText,
  File,
  Check,
  CheckCheck,
  CircleQuestionMark,
  Building,
  CreditCard as BankIcon,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalState } from "@/hooks/useModalState";
import { useOrderPaymentDetails } from "@/hooks/useOrderPaymentDetails";
import { useBankDetails } from '@/hooks/useBankDetails'

interface BuyCDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  usdtAmount: string;
  orderData?: any; // Add orderData prop
}
  
interface AdminPaymentDetails {
  orderId: string;
  customAmount: number;
  paymentMethod: string;
  adminUpiId: string | null;
  adminBankDetails: {
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    accountHolderName: string;
  };
}

export default function BuyCDMModal({
  isOpen,
  onClose,
  amount,
  usdtAmount,
  orderData, // Add this parameter
}: BuyCDMModalProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { saveModalState, getModalState, clearModalState } = useModalState();

  // Fetch payment details from database at intervals
  const { 
    paymentDetails, 
    isLoading: isLoadingPaymentDetails, 
    error: paymentDetailsError 
  } = useOrderPaymentDetails(
    orderData?.fullId || orderData?.id, 
    isOpen && !!orderData
  );

  // Check if admin has provided bank details
  const hasReceivedAdminDetails = !!(paymentDetails?.adminBankDetails);
  const displayAmount = paymentDetails?.customAmount?.toString() || amount;

  // Default bank details shown before admin sends custom ones
  const defaultBankDetails = {
    accountNumber: "XXXX-XXXX-XXXX",
    ifscCode: "WAIT001",
    branchName: "Waiting for Admin",
    accountHolderName: "Admin Name"
  };

  const displayBankDetails = paymentDetails?.adminBankDetails || defaultBankDetails;

  // Load saved state when modal opens
  useEffect(() => {
    if (isOpen && orderData) {
      console.log('📂 Loading CDM modal state for order:', orderData.fullId || orderData.id);
      const savedState = getModalState(orderData.fullId || orderData.id);
      if (savedState) {
        console.log('📋 Restoring CDM modal state:', savedState);
        
        // Restore the step states based on saved data
        if (savedState.currentStep >= 4) {
          setIsOrderComplete(true);
          setIsUploadComplete(true);
          setIsPaid(true);
          setIsWaitingConfirmation(true);
        } else if (savedState.currentStep >= 3) {
          setIsUploadComplete(true);
          setIsPaid(true);
          setIsWaitingConfirmation(true);
          setIsOrderComplete(false);
        } else if (savedState.currentStep >= 2) {
          setIsPaid(true);
          setIsWaitingConfirmation(true);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
        } else if (savedState.currentStep >= 1) {
          setIsWaitingConfirmation(true);
          setIsPaid(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
        } else {
          setIsPaid(false);
          setIsWaitingConfirmation(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
        }
      } else {
        // No saved state, start fresh
        console.log('🆕 No saved CDM state found, starting fresh');
        setIsPaid(false);
        setIsWaitingConfirmation(false);
        setIsUploadComplete(false);
        setIsOrderComplete(false);
      }
    }
  }, [isOpen, orderData]);

  // Save state whenever it changes
  useEffect(() => {
    if (orderData && isOpen) {
      const currentStep = isOrderComplete ? 4 : isUploadComplete ? 3 : isPaid ? 2 : isWaitingConfirmation ? 1 : 0;
      
      console.log('💾 Saving CDM modal state:', {
        orderId: orderData.fullId || orderData.id,
        currentStep,
        hasAdminDetails: !!paymentDetails
      });
      
      saveModalState(
        orderData.fullId || orderData.id,
        'BUY_CDM',
        currentStep,
        {
          accountNumber,
          confirmAccountNumber,
          ifscCode,
          branchName
        },
        paymentDetails
      );
    }
  }, [isPaid, isWaitingConfirmation, isUploadComplete, isOrderComplete, paymentDetails, orderData, isOpen, accountNumber, confirmAccountNumber, ifscCode, branchName]);

  // Reset modal state when opened for new orders (without orderData)
  useEffect(() => {
    if (isOpen && !orderData) {
      console.log('🔄 Resetting CDM modal state for new order');
      setIsPaid(false);
      setIsWaitingConfirmation(false);
      setIsUploadComplete(false);
      setIsOrderComplete(false);
      setCopiedField(null);
      setAccountNumber("");
      setConfirmAccountNumber("");
      setIfscCode("");
      setBranchName("");
    }
  }, [isOpen, orderData]);

  // Debug logging
  useEffect(() => {
    if (isOpen && orderData) {
      console.log('🖥️ Buy CDM Modal State Debug:', {
        orderData: orderData?.fullId || orderData?.id,
        hasReceivedAdminDetails,
        paymentDetails,
        displayBankDetails,
        isLoadingPaymentDetails,
        isPaid,
        isWaitingConfirmation,
        isUploadComplete,
        isOrderComplete
      });
    }
  }, [isOpen, hasReceivedAdminDetails, paymentDetails, orderData, displayBankDetails, isLoadingPaymentDetails, isPaid, isWaitingConfirmation, isUploadComplete, isOrderComplete]);

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
    setTimeout(() => {
      setIsPaid(true);
    }, 2000);
  };

  const handleUploadDetails = () => {
    setIsUploadComplete(true);
  };

  const handleCoinReceived = () => {
    setIsOrderComplete(true);
  };

  const handleOrderComplete = () => {
    if (orderData) {
      clearModalState(orderData.fullId || orderData.id);
    }
    onClose();
  };

  const { bankDetails } = useBankDetails()

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
                <div className={`w-3 h-3 rounded-full ${
                  isOrderComplete ? "bg-gray-400" :
                  isUploadComplete ? "bg-green-400" :
                  hasReceivedAdminDetails ? "bg-blue-400" : "bg-yellow-400"
                }`}></div>
                <span className="text-white font-medium">
                  Order {orderData?.id || orderData?.fullId?.slice(-6) || '#14'}
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
                {/* Loading State */}
                {isLoadingPaymentDetails && !hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-400 font-medium">Checking for Admin Updates...</span>
                    </div>
                  </motion.div>
                )}

                {/* Order Status Messages */}
                {!hasReceivedAdminDetails && !isLoadingPaymentDetails && (
                  <motion.div
                    className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 font-medium">Order Placed Successfully</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Waiting for admin to accept your order and provide bank details
                    </p>
                  </motion.div>
                )}

                {hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Admin Bank Details Received</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Please transfer to the admin's bank account below
                    </p>
                  </motion.div>
                )}

                {/* Amount Display */}
                <div className="mb-6">
                  <div className="text-4xl md:text-4xl font-bold text-white mb-2">
                    {displayAmount}₹
                    {hasReceivedAdminDetails && paymentDetails?.customAmount && displayAmount !== amount && (
                      <div className="text-sm text-green-400 font-normal">
                        (Custom amount set by admin)
                      </div>
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
                  <div className="text-xs text-white mt-2 mb-4">
                    {usdtAmount} USDT
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div className="flex items-center justify-center space-x-4 md:space-x-10 mb-6 flex-wrap gap-2">
                  <div className="bg-[#1D1C1C] text-black px-2.5 py-1.5 rounded text-sm font-medium flex items-center space-x-2">
                    <img src="/bank.svg" alt="" className="w-4 h-4" />
                    <span className="text-white">CDM</span>
                  </div>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    Buy Order
                  </span>
                  <span className="text-white px-2 py-1 bg-[#1D1C1C] rounded-md text-sm">
                    {orderData ? new Date(orderData.createdAt || Date.now()).toLocaleTimeString() : 'Today 11:40 PM'}
                  </span>
                </div>

                {/* Payment Instructions */}
                {hasReceivedAdminDetails && !isWaitingConfirmation && !isPaid && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Please transfer {displayAmount}₹ to admin's bank account
                    </div>
                    <div className="text-[#26AF6C] text-xs flex items-center justify-center mb-4">
                      <TriangleAlert className="w-3 h-3 mr-1" />
                      Transfer only to the admin's bank account provided below
                    </div>
                  </div>
                )}

                {!hasReceivedAdminDetails && !isLoadingPaymentDetails && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Your order is pending admin approval
                    </div>
                    <div className="text-gray-400 text-xs flex items-center justify-center mb-4">
                      <Clock className="w-3 h-3 mr-1" />
                      Checking for updates every 10 seconds...
                    </div>
                  </div>
                )}

                {/* Bank Details Section */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`rounded-xl p-6 mx-auto max-w-2xl ${
                    hasReceivedAdminDetails ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]/50 border border-dashed border-gray-600'
                  }`}>
                    <div className="flex items-center justify-center space-x-2 mb-6">
                      <Building className={`w-6 h-6 ${hasReceivedAdminDetails ? 'text-purple-400' : 'text-gray-500'}`} />
                      <h3 className={`text-xl font-semibold ${hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'}`}>
                        {hasReceivedAdminDetails ? 'Admin Bank Details' : 'Waiting for Bank Details'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Number */}
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <BankIcon className={`w-4 h-4 ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`}>Account Number</span>
                        </div>
                        <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                          hasReceivedAdminDetails ? 'bg-[#2a2a2a]' : 'bg-[#2a2a2a]/50'
                        }`}>
                          <span className={`font-medium text-lg ${hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'}`}>
                            {displayBankDetails.accountNumber}
                          </span>
                          {hasReceivedAdminDetails && (
                            <button
                              onClick={() => handleCopy(displayBankDetails.accountNumber, 'account')}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              {copiedField === 'account' ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* IFSC Code */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className={`w-4 h-4 ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`}>IFSC Code</span>
                        </div>
                        <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                          hasReceivedAdminDetails ? 'bg-[#2a2a2a]' : 'bg-[#2a2a2a]/50'
                        }`}>
                          <span className={`font-medium ${hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'}`}>
                            {displayBankDetails.ifscCode}
                          </span>
                          {hasReceivedAdminDetails && (
                            <button
                              onClick={() => handleCopy(displayBankDetails.ifscCode, 'ifsc')}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              {copiedField === 'ifsc' ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Branch Name */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className={`w-4 h-4 ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`}>Branch Name</span>
                        </div>
                        <div className={`rounded-lg px-4 py-3 ${
                          hasReceivedAdminDetails ? 'bg-[#2a2a2a]' : 'bg-[#2a2a2a]/50'
                        }`}>
                          <span className={`font-medium ${hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'}`}>
                            {displayBankDetails.branchName}
                          </span>
                        </div>
                      </div>

                      {/* Account Holder Name */}
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className={`w-4 h-4 ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${hasReceivedAdminDetails ? 'text-gray-400' : 'text-gray-600'}`}>Account Holder Name</span>
                        </div>
                        <div className={`rounded-lg px-4 py-3 ${
                          hasReceivedAdminDetails ? 'bg-[#2a2a2a]' : 'bg-[#2a2a2a]/50'
                        }`}>
                          <span className={`font-medium ${hasReceivedAdminDetails ? 'text-white' : 'text-gray-500'}`}>
                            {displayBankDetails.accountHolderName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* User Account Details Section - Show when waiting for confirmation */}
                {(isWaitingConfirmation || isPaid) && hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 mx-auto max-w-2xl">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white text-lg md:text-xl font-semibold">
                          Your Bank Details
                        </h3>
                        <button className="text-gray-400 hover:text-white">
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Account Number */}
                        <div>
                          <label className="flex items-center text-white text-sm mb-2">
                            <FileText className="w-4 h-4 mr-2" />
                            Your account number
                          </label>
                          <input
                            type="text"
                            value={bankDetails?.accountNumber || accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder={bankDetails?.accountNumber || "Add your Account Number"}
                            className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            readOnly={!!bankDetails?.accountNumber}
                          />
                        </div>

                        {/* IFSC Code */}
                        <div>
                          <label className="flex items-center text-white text-sm mb-2">
                            <FileText className="w-4 h-4 mr-2" />
                            IFSC CODE
                          </label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            placeholder="ICICI000234"
                            className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Confirm Account Number */}
                        <div>
                          <label className="flex items-center text-white text-sm mb-2">
                            <FileText className="w-4 h-4 mr-2" />
                            Confirm Your account Number
                          </label>
                          <input
                            type="text"
                            value={confirmAccountNumber}
                            onChange={(e) => setConfirmAccountNumber(e.target.value)}
                            placeholder="type your Account number again"
                            className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Branch Name */}
                        <div>
                          <label className="flex items-center text-white text-sm mb-2">
                            <Building className="w-4 h-4 mr-2" />
                            Your branch Name
                          </label>
                          <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="Add your Branch Name"
                            className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload Receipt Section - Hide when upload is complete */}
                    {!isUploadComplete && (
                      <div className="flex items-center justify-center mt-4 px-4">
                        <div className="flex max-w-xs rounded-sm items-center justify-center px-4 py-2 border border-[#2B2B2B]">
                          <Upload className="w-5 h-5 mr-2 text-white" />
                          <span className="text-white text-base md:text-lg font-medium">
                            Please upload Your Receipt
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Progress Bar */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-60 md:w-80 bg-gray-700 rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${
                      isOrderComplete ? 'w-full bg-green-500' :
                      isUploadComplete ? 'w-4/5 bg-green-500' :
                      isPaid ? 'w-3/5 bg-green-500' :
                      hasReceivedAdminDetails ? 'w-2/5 bg-blue-500' : 'w-1/4 bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="text-white text-sm font-medium">
                    {isOrderComplete ? 'Order Complete' :
                     isUploadComplete ? 'Receipt Uploaded' :
                     isPaid ? 'Payment Confirmed' :
                     hasReceivedAdminDetails ? 'Ready for Payment' : 'Waiting for Admin'}
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-4 md:px-0">
                  <button
                    onClick={
                      isOrderComplete
                        ? handleOrderComplete 
                        : isUploadComplete
                        ? handleCoinReceived
                        : isWaitingConfirmation || isPaid
                        ? handleUploadDetails
                        : hasReceivedAdminDetails
                        ? handlePaymentConfirm
                        : undefined
                    }
                    disabled={!hasReceivedAdminDetails && !isPaid && !isUploadComplete && !isOrderComplete}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      hasReceivedAdminDetails || isPaid || isUploadComplete || isOrderComplete
                        ? 'bg-[#622DBF] hover:bg-purple-700 cursor-pointer'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isOrderComplete ? (
                        <>
                          <CheckCheck className="w-5 h-5" />
                          <span>Order Complete</span>
                        </>
                      ) : isUploadComplete ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Coin Received on Wallet</span>
                        </>
                      ) : isWaitingConfirmation || isPaid ? (
                        <>
                          <File className="w-5 h-5" />
                          <span>Upload Full Payment Details</span>
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

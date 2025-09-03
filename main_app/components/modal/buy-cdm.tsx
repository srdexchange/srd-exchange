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
import { useWalletManager } from '@/hooks/useWalletManager'
import { useUSDTCalculation } from '@/lib/utils/calculateUSDT'
import {useRates} from '@/hooks/useRates'

interface BuyCDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  usdtAmount: string;
  orderData?: any;
}


export default function BuyCDMModal({
  isOpen,
  onClose,
  amount,
  usdtAmount,
  orderData, 
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
  const [isUpiPaymentStep, setIsUpiPaymentStep] = useState(false);
  const [isUpiPaid, setIsUpiPaid] = useState(false);
  const [isCoinReceived, setIsCoinReceived] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { saveModalState, getModalState, clearModalState } = useModalState();
  const { 
    paymentDetails, 
    isLoading: isLoadingPaymentDetails  } = useOrderPaymentDetails(
    orderData?.fullId || orderData?.id, 
    isOpen && !!orderData
  );

  const { calculateUSDTFromINR } = useUSDTCalculation();
  const { getBuyRate } = useRates();

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
        if (savedState.currentStep >= 5) {
          setIsOrderComplete(true);
          setIsUploadComplete(true);
          setIsPaid(true);
          setIsWaitingConfirmation(true);
          setIsUpiPaid(true);
          setIsUpiPaymentStep(false);
          setIsCoinReceived(true);
          setCurrentStep(5);
        } else if (savedState.currentStep >= 4) {
          setIsUploadComplete(true);
          setIsPaid(true);
          setIsWaitingConfirmation(true);
          setIsUpiPaid(true);
          setIsUpiPaymentStep(false);
          setIsOrderComplete(false);
          setIsCoinReceived(false);
          setCurrentStep(4);
        } else if (savedState.currentStep >= 3) {
          setIsPaid(true);
          setIsWaitingConfirmation(true);
          setIsUpiPaid(true);
          setIsUpiPaymentStep(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
          setIsCoinReceived(false);
          setCurrentStep(3);
        } else if (savedState.currentStep >= 2) {
          setIsWaitingConfirmation(true);
          setIsUpiPaid(true);
          setIsUpiPaymentStep(false);
          setIsPaid(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
          setIsCoinReceived(false);
          setCurrentStep(2);
        } else if (savedState.currentStep >= 1) {
          setIsUpiPaymentStep(true);
          setIsUpiPaid(false);
          setIsWaitingConfirmation(false);
          setIsPaid(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
          setIsCoinReceived(false);
          setCurrentStep(1);
        } else {
          setIsUpiPaymentStep(false);
          setIsUpiPaid(false);
          setIsPaid(false);
          setIsWaitingConfirmation(false);
          setIsUploadComplete(false);
          setIsOrderComplete(false);
          setIsCoinReceived(false);
          setCurrentStep(0);
        }
      } else {
        // No saved state, start fresh
        console.log('🆕 No saved CDM state found, starting fresh');
        setIsUpiPaymentStep(false);
        setIsUpiPaid(false);
        setIsPaid(false);
        setIsWaitingConfirmation(false);
        setIsUploadComplete(false);
        setIsOrderComplete(false);
        setIsCoinReceived(false);
        setCurrentStep(0);
      }
    }
  }, [isOpen, orderData]);

  // Save state whenever it changes
  useEffect(() => {
    if (orderData && isOpen) {
      const currentStepValue = isOrderComplete ? 5 : isUploadComplete ? 4 : isPaid ? 3 : isWaitingConfirmation ? 2 : isUpiPaid ? 1 : isUpiPaymentStep ? 1 : 0;
      setCurrentStep(currentStepValue);
      
      console.log('💾 Saving CDM modal state:', {
        orderId: orderData.fullId || orderData.id,
        currentStep: currentStepValue,
        hasAdminDetails: !!paymentDetails
      });
      
      saveModalState(
        orderData.fullId || orderData.id,
        'BUY_CDM',
        currentStepValue,
        {
          accountNumber,
          confirmAccountNumber,
          ifscCode,
          branchName
        },
        paymentDetails
      );
    }
  }, [isPaid, isWaitingConfirmation, isUploadComplete, isOrderComplete, isUpiPaymentStep, isUpiPaid, paymentDetails, orderData, isOpen, accountNumber, confirmAccountNumber, ifscCode, branchName]);


  useEffect(() => {
    if (isOpen && !orderData) {
      console.log('🔄 Resetting CDM modal state for new order');
      setIsUpiPaymentStep(false);
      setIsUpiPaid(false);
      setIsPaid(false);
      setIsWaitingConfirmation(false);
      setIsUploadComplete(false);
      setIsOrderComplete(false);
      setIsCoinReceived(false);
      setCurrentStep(0);
      setCopiedField(null);
      setAccountNumber("");
      setConfirmAccountNumber("");
      setIfscCode("");
      setBranchName("");
    }
  }, [isOpen, orderData]);

  // Auto-advance to UPI step when admin UPI is received
  useEffect(() => {
    if (paymentDetails?.adminUpiId && !isUpiPaymentStep && !isUpiPaid) {
      console.log('✅ Admin UPI ID received, showing UPI payment step');
      setIsUpiPaymentStep(true);
    }
  }, [paymentDetails?.adminUpiId, isUpiPaymentStep, isUpiPaid]);

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
        isOrderComplete,
        isCoinReceived,
        currentStep
      });
    }
  }, [isOpen, hasReceivedAdminDetails, paymentDetails, orderData, displayBankDetails, isLoadingPaymentDetails, isPaid, isWaitingConfirmation, isUploadComplete, isOrderComplete, isCoinReceived, currentStep]);

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
    setCurrentStep(2);
    setTimeout(() => {
      setIsPaid(true);
      setCurrentStep(3);
    }, 2000);
  };

  const handleUploadDetails = () => {
    setIsUploadComplete(true);
    setCurrentStep(4);
  };

  const { confirmOrderReceivedOnChain } = useWalletManager()

  const handleCoinReceived = async () => {
    try {
      console.log('🔗 Confirming order received on blockchain...')
      if (orderData?.blockchainOrderId) {
        await confirmOrderReceivedOnChain(parseInt(orderData.blockchainOrderId))
      }
      setIsCoinReceived(true)
      setIsOrderComplete(true)
      setCurrentStep(5)
    } catch (error) {
      console.error('❌ Error confirming order on blockchain:', error)
      // Still update UI even if blockchain call fails
      setIsCoinReceived(true)
      setIsOrderComplete(true)
      setCurrentStep(5)
    }
  }

  const handleOrderComplete = () => {
    if (orderData) {
      clearModalState(orderData.fullId || orderData.id);
    }
    onClose();
  };

  const handleUpiPaymentConfirm = () => {
    setIsUpiPaid(true);
    setIsUpiPaymentStep(false);
    setCurrentStep(1);
    setTimeout(() => {
      setIsWaitingConfirmation(true);
      setCurrentStep(2);
    }, 1000);
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
                {isLoadingPaymentDetails && !paymentDetails?.adminUpiId && (
                  <motion.div
                    className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-400 font-medium">Checking for Admin UPI ID...</span>
                    </div>
                  </motion.div>
                )}

                {/* Order Status Messages - Show waiting for UPI first */}
                {!paymentDetails?.adminUpiId && !isLoadingPaymentDetails && (
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
                      Waiting for admin to provide UPI ID for ₹500 verification payment
                    </p>
                  </motion.div>
                )}

                {paymentDetails?.adminUpiId && !isUpiPaid && (
                  <motion.div
                    className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Check className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-medium">Admin UPI ID Received</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Please pay ₹500 verification fee to the admin's UPI ID below
                    </p>
                  </motion.div>
                )}

                {isUpiPaid && !hasReceivedAdminDetails && (
                  <motion.div
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">UPI Payment Confirmed</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Now waiting for admin to provide bank details for main transfer
                    </p>
                  </motion.div>
                )}

                {hasReceivedAdminDetails && isUpiPaid && (
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

                {/* Amount Display - Show both rupee and USDT values when admin accepts */}
                <div className="mb-6">
                  {/* Primary Amount */}
                  <div className="text-4xl md:text-4xl font-bold text-white mb-2">
                    {!isUpiPaid 
                      ? '₹500' 
                      : hasReceivedAdminDetails && paymentDetails?.customAmount
                        ? `₹${paymentDetails.customAmount}`
                        : `₹${displayAmount}`
                    }
                  </div>
                  
                  {/* Secondary Amount - Show USDT equivalent when admin provides main transfer amount */}
                  {hasReceivedAdminDetails && isUpiPaid && (
                    <div className="text-2xl md:text-2xl font-medium text-gray-300 mb-2">
                      ≈ {paymentDetails?.customAmount 
                          ? calculateUSDTFromINR(paymentDetails.customAmount, 'CDM')
                          : usdtAmount
                        } USDT
                    </div>
                  )}
                  
                  {/* Status Labels */}
                  {!isUpiPaid && (
                    <div className="text-sm text-yellow-400 font-normal mb-2">
                      CDM Order Verification Fee
                    </div>
                  )}
                  {isUpiPaid && hasReceivedAdminDetails && paymentDetails?.customAmount && 
                   paymentDetails.originalAmount && 
                   Math.abs(paymentDetails.customAmount - paymentDetails.originalAmount) > 0.01 && (
                    <div className="text-sm text-green-400 font-normal mb-2">
                      ✨ Custom amount set by admin (Original: ₹{paymentDetails.originalAmount})
                    </div>
                  )}
                  
                  {/* Conversion Rate Display - Only show for main transfer */}
                  {hasReceivedAdminDetails && isUpiPaid && (
                    <div className="text-xs text-gray-400 mb-2">
                      You will receive {paymentDetails?.customAmount 
                        ? calculateUSDTFromINR(paymentDetails.customAmount, 'CDM')
                        : usdtAmount
                      } USDT for ₹{paymentDetails?.customAmount || displayAmount}
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
                    {!isUpiPaid ? 'Verification Payment' : 'CDM Bank Transfer'}
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
                {!paymentDetails?.adminUpiId && !isLoadingPaymentDetails && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Your CDM order is pending admin approval
                    </div>
                    <div className="text-gray-400 text-xs flex items-center justify-center mb-4">
                      <Clock className="w-3 h-3 mr-1" />
                      Checking for UPI ID updates every 10 seconds...
                    </div>
                  </div>
                )}

                {paymentDetails?.adminUpiId && !isUpiPaid && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Please pay ₹500 to admin's UPI ID for verification
                    </div>
                    <div className="text-[#26AF6C] text-xs flex items-center justify-center mb-4">
                      <TriangleAlert className="w-3 h-3 mr-1" />
                      This verification is required to start your CDM order
                    </div>
                  </div>
                )}

                {isUpiPaid && !hasReceivedAdminDetails && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Verification completed, waiting for bank details
                    </div>
                    <div className="text-gray-400 text-xs flex items-center justify-center mb-4">
                      <Clock className="w-3 h-3 mr-1" />
                      Admin will provide bank details for the main transfer...
                    </div>
                  </div>
                )}

                {hasReceivedAdminDetails && isUpiPaid && !isWaitingConfirmation && !isPaid && (
                  <div className="mb-8">
                    <div className="text-white mb-1">
                      Please transfer ₹{paymentDetails?.customAmount || displayAmount} to admin's bank account
                    </div>
                    <div className="text-[#26AF6C] text-xs flex items-center justify-center mb-4">
                      <TriangleAlert className="w-3 h-3 mr-1" />
                      Transfer only to the admin's bank account provided below
                    </div>
                    {/* Show rate information for main transfer */}
                    {paymentDetails?.customAmount && (
                      <div className="text-xs text-gray-400 text-center">
                        At current rate: 1 USDT = ₹{getBuyRate('CDM')} • You get {calculateUSDTFromINR(paymentDetails.customAmount, 'CDM')} USDT
                      </div>
                    )}
                  </div>
                )}

                {/* UPI ID Section - Show for verification payment */}
                {paymentDetails?.adminUpiId && !isUpiPaid && (
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center justify-between rounded-lg px-4 py-3 min-w-[280px] md:min-w-[325px] max-w-md w-full mx-4 bg-[#2a2a2a]">
                      <span className="font-medium text-lg md:text-lg text-white">
                        {paymentDetails.adminUpiId}
                      </span>
                      <button
                        onClick={() => handleCopy(paymentDetails.adminUpiId!, 'adminUpi')}
                        className="text-gray-400 hover:text-white transition-colors ml-4"
                      >
                        {copiedField === 'adminUpi' ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Waiting for UPI ID Section - Like buy-upi.tsx */}
                {!paymentDetails?.adminUpiId && (
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center justify-between rounded-lg px-4 py-3 min-w-[280px] md:min-w-[325px] max-w-md w-full mx-4 bg-[#2a2a2a]/50 border border-dashed border-gray-600">
                      <span className="font-medium text-lg md:text-lg text-gray-500">
                        Waiting for admin UPI ID...
                      </span>
                    </div>
                  </div>
                )}

                {/* Waiting for bank details after UPI payment */}
                {isUpiPaid && !hasReceivedAdminDetails && (
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center justify-between rounded-lg px-4 py-3 min-w-[280px] md:min-w-[325px] max-w-md w-full mx-4 bg-[#2a2a2a]/50 border border-dashed border-gray-600">
                      <span className="font-medium text-lg md:text-lg text-gray-500">
                        Waiting for bank details...
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank Details Section - Only show after UPI payment is confirmed */}
                {(isUpiPaid && hasReceivedAdminDetails) && (
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
                        <Building className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-semibold text-white">
                          Admin Bank Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Number */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <BankIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Account Number</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-[#2a2a2a]">
                            <span className="font-medium text-lg text-white">
                              {displayBankDetails.accountNumber}
                            </span>
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
                          </div>
                        </div>

                        {/* IFSC Code */}
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">IFSC Code</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-[#2a2a2a]">
                            <span className="font-medium text-white">
                              {displayBankDetails.ifscCode}
                            </span>
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
                          </div>
                        </div>

                        {/* Branch Name */}
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Branch Name</span>
                          </div>
                          <div className="rounded-lg px-4 py-3 bg-[#2a2a2a]">
                            <span className="font-medium text-white">
                              {displayBankDetails.branchName}
                            </span>
                          </div>
                        </div>

                        {/* Account Holder Name */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Account Holder Name</span>
                          </div>  
                          <div className="rounded-lg px-4 py-3 bg-[#2a2a2a]">
                            <span className="font-medium text-white">
                              {displayBankDetails.accountHolderName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* User Account Details Section - Show when waiting for confirmation */}
                {(isWaitingConfirmation || isPaid) && hasReceivedAdminDetails && isUpiPaid && (
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
                      isUploadComplete ? 'w-5/6 bg-green-500' :
                      isPaid ? 'w-4/6 bg-green-500' :
                      isWaitingConfirmation ? 'w-3/6 bg-green-500' :
                      isUpiPaid && hasReceivedAdminDetails ? 'w-2/6 bg-blue-500' :
                      isUpiPaid ? 'w-2/6 bg-green-500' :
                      paymentDetails?.adminUpiId ? 'w-1/6 bg-blue-500' : 'w-1/12 bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="text-white text-sm font-medium">
                    {isOrderComplete ? 'Order Complete' :
                     isUploadComplete ? 'Receipt Uploaded' :
                     isPaid ? 'CDM Payment Confirmed' :
                     isWaitingConfirmation ? 'Processing CDM Transfer' :
                     isUpiPaid && hasReceivedAdminDetails ? 'Ready for CDM Transfer' :
                     isUpiPaid ? 'UPI Verified - Waiting for Bank Details' :
                     paymentDetails?.adminUpiId ? 'UPI Verification Required' : 'Waiting for Admin UPI ID'}
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
                        : isUpiPaid && hasReceivedAdminDetails
                        ? handlePaymentConfirm
                        : paymentDetails?.adminUpiId && !isUpiPaid
                        ? handleUpiPaymentConfirm
                        : undefined
                    }
                    disabled={
                      !paymentDetails?.adminUpiId && !isUpiPaid && !isPaid && !isUploadComplete && !isOrderComplete ||
                      (isUpiPaid && !hasReceivedAdminDetails) // Add this condition to disable when waiting for bank details
                    }
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      (paymentDetails?.adminUpiId || isUpiPaid || isPaid || isUploadComplete || isOrderComplete) && 
                      !(isUpiPaid && !hasReceivedAdminDetails) // Ensure button is inactive when waiting for bank details
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
                          <Upload className="w-5 h-5" />
                          <span>Upload Full Payment Details</span>
                        </>
                      ) : isUpiPaid && hasReceivedAdminDetails ? (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>I Paid ₹{paymentDetails?.customAmount || displayAmount} To Admin Bank</span>
                        </>
                      ) : isUpiPaid && !hasReceivedAdminDetails ? (
                        // New condition for waiting state after UPI payment
                        <>
                          <Clock className="w-5 h-5 animate-pulse" />
                          <span>Waiting for Admin Bank Details</span>
                        </>
                      ) : paymentDetails?.adminUpiId && !isUpiPaid ? (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>I Paid ₹500 To Admin UPI</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 animate-pulse" />
                          <span>Waiting for Admin UPI ID</span>
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


"use client";

import { useState } from "react";
import {
  X,
  Building,
  FileText,
  User,
  CreditCard as BankIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bankDetails: BankDetailsData) => Promise<boolean>;
  isLoading?: boolean;
}

export interface BankDetailsData {
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountHolderName: string;
}

export default function BankDetailsModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: BankDetailsModalProps) {
  const [formData, setFormData] = useState<BankDetailsData>({
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountHolderName: "",
  });
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (formData.accountNumber.length < 8) {
      newErrors.accountNumber = "Account number must be at least 8 digits";
    }

    if (!confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Please confirm your account number";
    } else if (formData.accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = "Please enter a valid IFSC code";
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = "Branch name is required";
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BankDetailsData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleConfirmAccountChange = (value: string) => {
    setConfirmAccountNumber(value);
    if (errors.confirmAccountNumber) {
      setErrors(prev => ({ ...prev, confirmAccountNumber: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const success = await onSave({
        ...formData,
        ifscCode: formData.ifscCode.toUpperCase(),
      });

      if (success) {
        // Reset form
        setFormData({
          accountNumber: "",
          ifscCode: "",
          branchName: "",
          accountHolderName: "",
        });
        setConfirmAccountNumber("");
        setErrors({});
        onClose();
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return; // Prevent closing during save
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111010] rounded-xl max-w-2xl w-full relative overflow-hidden max-h-[90vh]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2F2F2F]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#622DBF]/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-[#622DBF]" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Add Bank Details
                </h2>
              </div>

              <button
                onClick={handleClose}
                disabled={isSaving}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Info Banner */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-400 font-medium mb-1">
                      Bank Details Required
                    </h3>
                    <p className="text-gray-300 text-sm">
                      To complete CDM (Cash Deposit Machine) transactions, we need your bank account details. 
                      This information will be securely stored and used for future transactions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Account Holder Name */}
                <div>
                  <label className="flex items-center text-white text-sm font-medium mb-2">
                    <User className="w-4 h-4 mr-2" />
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                    placeholder="Enter full name as per bank account"
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                      errors.accountHolderName
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-purple-500"
                    }`}
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-400 text-sm mt-1">{errors.accountHolderName}</p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label className="flex items-center text-white text-sm font-medium mb-2">
                    <BankIcon className="w-4 h-4 mr-2" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter your bank account number"
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                      errors.accountNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-purple-500"
                    }`}
                  />
                  {errors.accountNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.accountNumber}</p>
                  )}
                </div>

                {/* Confirm Account Number */}
                <div>
                  <label className="flex items-center text-white text-sm font-medium mb-2">
                    <BankIcon className="w-4 h-4 mr-2" />
                    Confirm Account Number
                  </label>
                  <input
                    type="text"
                    value={confirmAccountNumber}
                    onChange={(e) => handleConfirmAccountChange(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Re-enter your account number"
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                      errors.confirmAccountNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-purple-500"
                    }`}
                  />
                  {errors.confirmAccountNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmAccountNumber}</p>
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="flex items-center text-white text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 mr-2" />
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange("ifscCode", e.target.value.toUpperCase())}
                    placeholder="e.g., SBIN0001234"
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                      errors.ifscCode
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-purple-500"
                    }`}
                  />
                  {errors.ifscCode && (
                    <p className="text-red-400 text-sm mt-1">{errors.ifscCode}</p>
                  )}
                </div>

                {/* Branch Name */}
                <div>
                  <label className="flex items-center text-white text-sm font-medium mb-2">
                    <Building className="w-4 h-4 mr-2" />
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange("branchName", e.target.value)}
                    placeholder="Enter your bank branch name"
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                      errors.branchName
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-purple-500"
                    }`}
                  />
                  {errors.branchName && (
                    <p className="text-red-400 text-sm mt-1">{errors.branchName}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || isLoading}
                  className="flex-1 px-6 py-3 bg-[#622DBF] hover:bg-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Bank Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
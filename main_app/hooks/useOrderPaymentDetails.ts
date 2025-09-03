import { useState, useCallback, useEffect } from 'react';

interface PaymentDetails {
  adminUpiId: string | null;
  adminBankDetails: {
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    accountHolderName: string;
  } | null;
  customAmount: number | null;
  originalAmount: number | null;
  status: string | null;
  adminNotes: string | null;
  lastUpdated: string | null;
}

export function useOrderPaymentDetails(orderId: string, enabled: boolean = true) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetails = useCallback(async () => {
    if (!orderId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching payment details for order:', orderId);

      const response = await fetch(`/api/orders/${orderId}/payment-details`);

      if (!response.ok) {
        throw new Error(`Failed to fetch payment details: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.paymentDetails) {
        const details: PaymentDetails = {
          adminUpiId: data.paymentDetails.adminUpiId || null,
          adminBankDetails: data.paymentDetails.adminBankDetails || null,
          customAmount: data.paymentDetails.customAmount ? parseFloat(data.paymentDetails.customAmount.toString()) : null,
          originalAmount: data.paymentDetails.originalAmount ? parseFloat(data.paymentDetails.originalAmount.toString()) : null,
          status: data.paymentDetails.status || null,
          adminNotes: data.paymentDetails.adminNotes || null,
          lastUpdated: data.paymentDetails.lastUpdated || null
        };

        console.log('📥 Payment details received:', {
          orderId,
          adminUpiId: details.adminUpiId,
          customAmount: details.customAmount,
          originalAmount: details.originalAmount,
          status: details.status
        });

        setPaymentDetails(details);
      } else {
        console.log('ℹ️ No payment details available yet for order:', orderId);
        setPaymentDetails(null);
      }
    } catch (err) {
      console.error('❌ Error fetching payment details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment details');
      setPaymentDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchPaymentDetails();

    const interval = setInterval(() => {
      fetchPaymentDetails();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchPaymentDetails, enabled]);

  return {
    paymentDetails,
    isLoading,
    error,
    refetch: fetchPaymentDetails
  };
}
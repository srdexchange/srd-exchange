import { useState, useEffect, useCallback } from 'react';

interface OrderPaymentDetails {
  orderId: string;
  adminUpiId?: string;
  adminBankDetails?: {
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    accountHolderName: string;
  };
  customAmount?: number;
  status: string;
  lastUpdated: string;
}

export const useOrderPaymentDetails = (orderId: string | null, enabled: boolean = true) => {
  const [paymentDetails, setPaymentDetails] = useState<OrderPaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetails = useCallback(async () => {
    if (!orderId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/payment-details`);
      const data = await response.json();

      if (data.success) {
        setPaymentDetails(data.paymentDetails);
      } else {
        setError(data.error || 'Failed to fetch payment details');
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError('Failed to fetch payment details');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  // Poll every 10 seconds when enabled
  useEffect(() => {
    if (!enabled || !orderId) return;

    const interval = setInterval(() => {
      fetchPaymentDetails();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [fetchPaymentDetails, enabled, orderId]);

  return {
    paymentDetails,
    isLoading,
    error,
    refetch: fetchPaymentDetails
  };
};
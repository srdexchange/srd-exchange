'use client'

import { useState, useEffect } from 'react';

interface Rate {
  buyRate: number;
  sellRate: number;
  currency: 'UPI' | 'CDM';
}

export const useRates = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/admin/rates');
      const data = await response.json();
      
      if (data.success) {
        setRates(data.rates);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      // Fallback rates
      setRates([
        { buyRate: 84.5, sellRate: 84.0, currency: 'UPI' },
        { buyRate: 84.3, sellRate: 83.8, currency: 'CDM' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const getBuyRate = (currency: 'UPI' | 'CDM') => {
    const rate = rates.find(r => r.currency === currency);
    return rate?.buyRate || (currency === 'UPI' ? 84.5 : 84.3);
  };

  const getSellRate = (currency: 'UPI' | 'CDM') => {
    const rate = rates.find(r => r.currency === currency);
    return rate?.sellRate || (currency === 'UPI' ? 84.0 : 83.8);
  };

  return {
    rates,
    loading,
    getBuyRate,
    getSellRate,
    refetch: fetchRates
  };
};
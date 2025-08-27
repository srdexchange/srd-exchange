'use client'

import { useState, useEffect, useCallback } from 'react'

interface Rate {
  id: string
  type: string
  currency: 'UPI' | 'CDM'
  buyRate: number
  sellRate: number
  updatedAt: string
}

export function useRates() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rates')
      const data = await response.json()
      
      if (response.ok) {
        setRates(data.rates)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch rates')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const getRateByCurrency = useCallback((currency: 'UPI' | 'CDM') => {
    return rates.find(rate => rate.currency === currency)
  }, [rates])

  const getBuyRate = useCallback((currency: 'UPI' | 'CDM' = 'UPI') => {
    const rate = getRateByCurrency(currency)
    return rate ? rate.buyRate : 85.6 // Default fallback
  }, [getRateByCurrency])

  const getSellRate = useCallback((currency: 'UPI' | 'CDM' = 'UPI') => {
    const rate = getRateByCurrency(currency)
    return rate ? rate.sellRate : 85.6 // Default fallback
  }, [getRateByCurrency])

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
    getRateByCurrency,
    getBuyRate,
    getSellRate
  }
}
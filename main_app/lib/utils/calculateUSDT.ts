import { useRates } from '@/hooks/useRates'

export function useUSDTCalculation() {
  const { getBuyRate } = useRates()
  
  const calculateUSDTFromINR = (inrAmount: number | string, paymentMethod: 'UPI' | 'CDM' = 'UPI'): string => {
    const numericAmount = typeof inrAmount === 'string' ? parseFloat(inrAmount) : inrAmount
    if (isNaN(numericAmount) || numericAmount <= 0) return '0.0000'
    
    // Get current buy rate for the payment method
    const currentRate = getBuyRate(paymentMethod)
    
    // Calculate USDT: INR Amount ÷ Buy Rate = USDT
    const usdtAmount = numericAmount / currentRate
    
    console.log('💱 USDT Calculation:', {
      inrAmount: numericAmount,
      paymentMethod,
      currentBuyRate: currentRate,
      calculatedUSDT: usdtAmount.toFixed(4)
    })
    
    return usdtAmount.toFixed(4)
  }
  
  const calculateINRFromUSDT = (usdtAmount: number | string, paymentMethod: 'UPI' | 'CDM' = 'UPI'): string => {
    const numericAmount = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount
    if (isNaN(numericAmount) || numericAmount <= 0) return '0.00'
    
    // Get current buy rate for the payment method  
    const currentRate = getBuyRate(paymentMethod)
    
    // Calculate INR: USDT Amount × Buy Rate = INR
    const inrAmount = numericAmount * currentRate
    
    return inrAmount.toFixed(2)
  }
  
  return { calculateUSDTFromINR, calculateINRFromUSDT }
}
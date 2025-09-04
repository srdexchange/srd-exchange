'use client'

import { Copy, User, ExternalLink, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletManager } from '@/hooks/useWalletManager'
import { useUserOrders } from '@/hooks/useUserOrders'
import { useRates } from '@/hooks/useRates'
import { useModalState } from '@/hooks/useModalState'
import { useChainId } from 'wagmi'
import BuyCDMModal from './modal/buy-cdm'
import BuyUPIModal from './modal/buy-upi'
import SellUPIModal from './modal/sell-upi'
import SellCDMModal from './modal/sell-cdm'
import BankDetailsModal, { BankDetailsData } from './modal/bank-details-modal'
import { useBankDetails } from '@/hooks/useBankDetails'
import { readContract } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { parseUnits, formatUnits } from 'viem'


const CONTRACTS = {
  P2P_TRADING: {
    [56]: '0xD64d78dCFc550F131813a949c27b2b439d908F54' as `0x${string}`,
  },
  USDT: {
    [56]: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
  }
}

const USDT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  }
] as const

export default function BuySellSection() {

  const UPI_LIMIT_USDT = 100; 
  const CDM_MIN_USDT = 100;    
  const CDM_MAX_USDT = 500; 

  const chainId = useChainId()
  const [activeTab, setActiveTab] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [showBuyCDMModal, setShowBuyCDMModal] = useState(false)
  const [showBuyUPIModal, setShowBuyUPIModal] = useState(false)
  const [showSellUPIModal, setShowSellUPIModal] = useState(false)
  const [showSellCDMModal, setShowSellCDMModal] = useState(false)
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)

  const { saveModalState } = useModalState()

  // Wallet and orders data
  const { 
    address, 
    isConnected, 
    walletData, 
    isLoading: walletLoading, 
    refetchBalances,
    createSellOrderOnChain,
    approveUSDT
  } = useWalletManager()
  
  const { 
    orders, 
    isLoading: ordersLoading, 
    refetch: refetchOrders 
  } = useUserOrders()

  // Get dynamic rates
  const { getBuyRate, getSellRate, loading: ratesLoading } = useRates()

  // Add bank details hook
  const { bankDetails, saveBankDetails, isLoading: bankDetailsLoading } = useBankDetails()

  // Get rates based on payment method (default to UPI)
  const currentPaymentMethod = paymentMethod === 'cdm' ? 'CDM' : 'UPI'
  const buyPrice = getBuyRate(currentPaymentMethod)
  const sellPrice = getSellRate(currentPaymentMethod)

  // Helper functions
  const calculateUSDT = (rupeeAmount: string) => {
    const numericAmount = parseFloat(rupeeAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) return '0'
    // For buying: rupees / buy_rate = USDT
    const usdtAmount = numericAmount / buyPrice
    return usdtAmount.toFixed(4) // More precision for USDT
  }

  const calculateRupee = (usdtAmount: string) => {
    const numericAmount = parseFloat(usdtAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) return '0'
    // For selling: USDT * sell_rate = rupees
    const rupeeAmount = numericAmount * sellPrice
    return rupeeAmount.toFixed(2)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetchBalances(), refetchOrders()])
  }

  const usdtAmount = calculateUSDT(amount)
  const rupeeAmount = calculateRupee(amount)

  const getPaymentMethodName = () => {
    switch(paymentMethod) {
      case 'upi': return 'UPI'
      case 'cdm': return 'CDM'
      default: return ''
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPaymentMethod('')
    setAmount('')
  }

  // Create order function with enhanced error handling
  const createOrder = async (orderType: string, orderAmount: string, rate: number) => {
    if (!address) return null

    try {
      let finalOrderAmount = orderAmount
      let finalUsdtAmount = ''
      
      if (orderType.includes('BUY')) {
        // For buy orders: user enters rupees, we calculate USDT
        finalOrderAmount = orderAmount // rupees amount
        finalUsdtAmount = calculateUSDT(orderAmount) // converted USDT
      } else {
        // For sell orders: user enters USDT, we calculate rupees
        finalUsdtAmount = orderAmount // USDT amount (what user entered)
        finalOrderAmount = calculateRupee(orderAmount) // converted rupees
      }
      
      console.log('🚀 Creating order with conversions:', {
        orderType,
        userEnteredAmount: orderAmount,
        finalOrderAmount, // Always rupees for database
        finalUsdtAmount,  // Always USDT amount
        rate,
        buyPrice,
        sellPrice,
        address,
        paymentMethod
      });

      if (orderType.includes('SELL')) {
        console.log('💰 SELL ORDER: Via Gas Station (Gas Station pays gas)');
        
        try {
          // Get admin wallet address
          const adminWallet = await readContract(config as any, {
            address: CONTRACTS.P2P_TRADING[56],
            abi: [{
              inputs: [],
              name: "getAdminWallet",
              outputs: [{ internalType: "address", name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            }],
            functionName: "getAdminWallet",
          }) as string;

          console.log('🔍 Creating sell order via Gas Station:', {
            finalUsdtAmount,
            finalOrderAmount,
            orderType,
            userAddress: address,
            adminWallet
          });
          
          // Step 1: Check if user has approved Gas Station
          const gasStationAddress = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E";

          let currentAllowance: bigint;
          try {
            currentAllowance = await readContract(config as any, {
              address: CONTRACTS.USDT[56],
              abi: USDT_ABI,
              functionName: 'allowance',
              args: [address, gasStationAddress],
            });
          } catch (allowanceError) {
            console.error('❌ Failed to check allowance:', allowanceError);
            throw new Error('Unable to check Gas Station approval status. Please try again.');
          }

          const requiredAmount = parseUnits(finalUsdtAmount, 18); // BSC USDT uses 18 decimals

          console.log('🔍 Gas Station approval check:', {
            currentAllowance: currentAllowance.toString(),
            requiredAmount: requiredAmount.toString(),
            sufficient: currentAllowance >= requiredAmount
          });

          if (currentAllowance < requiredAmount) {
            console.log('🔓 User needs to approve Gas Station for USDT...');
            
            const shouldApprove = confirm(
              `🔐 GAS STATION APPROVAL REQUIRED\n\n` +
              `To enable gas-free transactions, you need to approve Gas Station for USDT spending.\n\n` +
              `✅ You pay gas ONLY for this approval (~$0.20)\n` +
              `✅ Gas Station pays gas for the actual USDT transfer\n` +
              `✅ Future orders will be completely gas-free\n\n` +
              `Approving ${(parseFloat(finalUsdtAmount) * 10).toFixed(2)} USDT for future orders\n\n` +
              `Click OK to approve Gas Station`
            );

            if (!shouldApprove) {
              throw new Error('Gas Station approval cancelled by user');
            }

            try {
              // User approves Gas Station (user pays gas ONLY for this approval)
              const approveAmount = (parseFloat(finalUsdtAmount) * 10).toFixed(6); // 10x for future transactions
              
              console.log('🔓 Submitting Gas Station approval transaction...');
              await approveUSDT(gasStationAddress as `0x${string}`, approveAmount);
              
              console.log('⏳ Waiting for Gas Station approval confirmation...');
              

              const isApprovalVerified = await verifyGasStationApproval(address, gasStationAddress, finalUsdtAmount);
              
              if (!isApprovalVerified) {
                throw new Error('Gas Station approval verification failed. Please wait for your approval transaction to confirm and try again.');
              }
              
              console.log('✅ Gas Station approval verified successfully');
              
            } catch (approvalError) {
              console.error('❌ Gas Station approval failed:', approvalError);
              const errorMessage = approvalError instanceof Error ? approvalError.message : String(approvalError);
              
              if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
                throw new Error('Gas Station approval was rejected in wallet. Please approve to continue.');
              } else if (errorMessage.includes('insufficient funds')) {
                throw new Error('Insufficient BNB for gas fees. Please add BNB to your wallet and try again.');
              } else {
                throw new Error(`Gas Station approval failed: ${errorMessage}`);
              }
            }
          }

          // Step 2: Gas Station executes the transfer (Gas Station pays gas)
          console.log('🚀 Gas Station executing USDT transfer (Gas Station pays ALL gas fees)...');

          // 🔥 FIX: Double-check approval status before calling API
          console.log('🔍 Final approval verification before Gas Station transfer...');
          const finalAllowanceCheck = await readContract(config as any, {
            address: CONTRACTS.USDT[56],
            abi: USDT_ABI,
            functionName: 'allowance',
            args: [address, gasStationAddress],
          });

          const finalRequiredAmount = parseUnits(finalUsdtAmount, 18);
          console.log('🔍 Final allowance verification:', {
            finalAllowance: finalAllowanceCheck.toString(),
            requiredAmount: finalRequiredAmount.toString(),
            sufficient: finalAllowanceCheck >= finalRequiredAmount
          });

          if (finalAllowanceCheck < finalRequiredAmount) {
            throw new Error(`Approval verification failed. Please wait for your approval transaction to confirm and try again. Current allowance: ${formatUnits(finalAllowanceCheck, 18)} USDT, Required: ${finalUsdtAmount} USDT`);
          }

          console.log('✅ Final approval verification passed - proceeding with Gas Station API call');

          let gasStationResult: any;

          try {
            const response = await fetch('/api/gas-station/user-sell-transfer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userAddress: address,
                adminAddress: adminWallet,
                usdtAmount: finalUsdtAmount,
                inrAmount: parseFloat(finalOrderAmount),
                orderType,
                chainId: 56
              })
            });

            gasStationResult = await response.json();

            if (!response.ok) {
              // Handle specific error codes
              if (gasStationResult.code === 'APPROVAL_REQUIRED' || gasStationResult.needsApproval) {
                // This shouldn't happen after our verification, but handle gracefully
                throw new Error('Gas Station still reports missing approval. Your approval transaction may still be pending. Please wait a moment and try again.');
              } else if (gasStationResult.code === 'INSUFFICIENT_BALANCE') {
                throw new Error('INSUFFICIENT_BALANCE: You do not have enough USDT for this transaction.');
              } else if (gasStationResult.retryable) {
                // For network issues, offer retry option
                const shouldRetry = confirm(
                  `⚠️ NETWORK TEMPORARILY BUSY\n\n` +
                  `${gasStationResult.error}\n\n` +
                  `This is usually temporary. Would you like to try again?`
                );
                
                if (shouldRetry) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  return createOrder(orderType, orderAmount, rate);
                } else {
                  throw new Error('Transaction cancelled by user.');
                }
              } else {
                throw new Error(gasStationResult.error || 'Gas Station transfer failed');
              }
            }

            console.log('✅ Gas Station transfer successful - Gas Station paid all gas fees:', gasStationResult.txHash);
            
          } catch (gasStationError) {
            console.error('❌ Gas Station API call failed:', gasStationError);
            
            const errorMessage = gasStationError instanceof Error ? gasStationError.message : String(gasStationError);
            
            if (errorMessage.includes('approval')) {
              throw new Error('Gas Station approval issue. Please ensure your approval transaction is confirmed and try again.');
            } else if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
              throw new Error('Insufficient USDT balance for this order.');
            } else {
              throw new Error(`Gas Station error: ${errorMessage}`);
            }
          }

          console.log('✅ Gas Station transfer successful - Gas Station paid all gas fees:', gasStationResult.txHash);
          
          // Wait for Gas Station transaction
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Step 3: Create database order after successful Gas Station transfer
          console.log('📝 Creating database order after Gas Station transfer...');
          
          const orderPayload = {
            walletAddress: address,
            orderType: orderType,
            amount: finalOrderAmount, // Rupees for database
            usdtAmount: finalUsdtAmount, // USDT amount for database
            buyRate: null,
            sellRate: rate,
            paymentMethod: paymentMethod.toUpperCase(),
            blockchainOrderId: null,
            status: 'PENDING_ADMIN_PAYMENT', // Admin needs to pay user now
            gasStationTxHash: gasStationResult.txHash
          };
          
          console.log('📋 Order payload:', orderPayload);
          
          const dbResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload),
          })

          console.log('📡 Database response status:', dbResponse.status);
          
          if (!dbResponse.ok) {
            const errorText = await dbResponse.text();
            console.error('❌ Database API response error:', errorText);
            throw new Error(`Database API error: ${dbResponse.status} - ${errorText}`);
          }
          
          const data = await dbResponse.json()
          console.log('📋 Database response data:', data);
          
          if (!data.success) {
            console.error('❌ Database order creation failed:', data.error);
            throw new Error(data.error || 'Failed to create database order');
          }

          const databaseOrder = data.order
          console.log('✅ Sell order created - Gas Station transferred USDT, waiting for admin payment');
          
          await refetchOrders();
          return databaseOrder;
          
        } catch (sellError) {
          console.error('❌ Gas Station sell order creation failed:', sellError);
          
          const errorMessage = sellError instanceof Error ? sellError.message : String(sellError);
          
          // Provide specific error messages
          if (errorMessage.includes('Gas Station approval cancelled')) {
            throw new Error('Gas Station approval cancelled. This approval enables gas-free transactions.');
          } else if (errorMessage.includes('Insufficient USDT balance')) {
            throw new Error('Insufficient USDT balance. Please ensure you have enough USDT for this order.');
          } else if (errorMessage.includes('User rejected')) {
            throw new Error('Transaction cancelled by user.');
          } else if (errorMessage.includes('Gas Station not ready')) {
            throw new Error('Gas Station is temporarily unavailable. Please try again later.');
          } else {
            throw new Error(`Gas Station sell order failed: ${errorMessage}`);
          }
        }
      } else {
        // For buy orders, create database order only (existing logic remains the same)
        console.log('💰 BUY ORDER: Database only (Gas Station handled by admin)');
        
        const buyOrderPayload = {
          walletAddress: address,
          orderType: orderType,
          amount: finalOrderAmount,
          usdtAmount: finalUsdtAmount,
          buyRate: orderType.includes('BUY') ? rate : null,
          sellRate: orderType.includes('SELL') ? rate : null,
          paymentMethod: paymentMethod.toUpperCase(),
          blockchainOrderId: null,
          status: 'PENDING'
        };
        
        console.log('📋 Buy order payload:', buyOrderPayload);
        
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(buyOrderPayload),
          })

          console.log('📡 Buy order response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Buy order API response error:', errorText);
            throw new Error(`Buy order API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json()
          console.log('📋 Buy order response data:', data);
          
          if (data.success) {
            await refetchOrders()
            console.log('💾 Buy order saved to database')
            return data.order
          } else {
            throw new Error(data.error || 'Failed to create buy order')
          }
        } catch (buyOrderError) {
          console.error('❌ Buy order database error:', buyOrderError);
          const errorMessage = buyOrderError instanceof Error ? buyOrderError.message : String(buyOrderError);
          throw new Error(`Buy order creation failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('❌ Error creating order - Full details:', error);
      console.error('❌ Error stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Enhanced error messages for better user experience
      let displayMessage = errorMessage;
      if (errorMessage.includes('approval required')) {
        displayMessage = 'USDT approval required. Please approve USDT spending in your wallet first, then try creating the order again.';
      } else if (errorMessage.includes('insufficient')) {
        displayMessage = 'Insufficient USDT balance. Please check your wallet balance and ensure you have enough USDT for this order.';
      } else if (errorMessage.includes('transfer failed')) {
        displayMessage = 'USDT transfer failed. Please ensure you have enough USDT and BNB for gas fees.';
      } else if (errorMessage.includes('Database error')) {
        displayMessage = `Database error: ${errorMessage}. Please try again or contact support if the issue persists.`;
      } else if (errorMessage.includes('Blockchain transaction failed')) {
        displayMessage = 'Blockchain transaction failed. The database order was automatically cleaned up. Your funds are safe. Please try again.';
      } else if (errorMessage.includes('execution reverted')) {
        displayMessage = 'Smart contract error. Please check your USDT balance and allowance, then try again.';
      } else if (errorMessage.includes('User rejected')) {
        displayMessage = 'Transaction was cancelled by user.';
      } else if (errorMessage.includes('API error')) {
        displayMessage = `Server error: ${errorMessage}. Please try again or contact support.`;
      }
      
      // Don't show the raw error to user, but log it for debugging
      console.error('❌ Raw error for debugging:', error);
      throw new Error(displayMessage);
    }
  }

  // Add validation functions
  const validateUSDTLimits = (usdtAmount: number, paymentMethod: string): { isValid: boolean; error: string } => {
    if (paymentMethod === 'upi') {
      if (usdtAmount > UPI_LIMIT_USDT) {
        return { 
          isValid: false, 
          error: `UPI orders are limited to ${UPI_LIMIT_USDT} USDT maximum. Current: ${usdtAmount.toFixed(4)} USDT` 
        };
      }
    } else if (paymentMethod === 'cdm') {
      if (usdtAmount < CDM_MIN_USDT) {
        return { 
          isValid: false, 
          error: `CDM orders require minimum ${CDM_MIN_USDT} USDT. Current: ${usdtAmount.toFixed(4)} USDT` 
        };
      }
      if (usdtAmount > CDM_MAX_USDT) {
        return { 
          isValid: false, 
          error: `CDM orders are limited to ${CDM_MAX_USDT} USDT maximum. Current: ${usdtAmount.toFixed(4)} USDT` 
        };
      }
    }
    return { isValid: true, error: '' };
  };

  const getRupeeLimitsForPaymentMethod = (paymentMethod: string): { min: number; max: number } => {
    const currentRate = activeTab === 'buy' ? buyPrice : sellPrice;
    
    if (paymentMethod === 'upi') {
      return {
        min: 0,
        max: UPI_LIMIT_USDT * currentRate
      };
    } else if (paymentMethod === 'cdm') {
      return {
        min: CDM_MIN_USDT * currentRate,
        max: CDM_MAX_USDT * currentRate
      };
    }
    return { min: 0, max: Infinity };
  };

  // Update the handleBuySellClick function to include validation
  const handleBuySellClick = async () => {
    if (!isConnected || !amount || parseFloat(amount) <= 0) return

    console.log('🎯 Handle buy/sell click:', { 
      activeTab, 
      paymentMethod, 
      hasBankDetails: !!bankDetails,
      walletAddress: address 
    });

    // Calculate USDT amount for validation
    let usdtAmountForValidation: number;
    if (activeTab === 'buy') {
      // For buy orders: user enters rupees, calculate USDT
      usdtAmountForValidation = parseFloat(calculateUSDT(amount));
    } else {
      // For sell orders: user enters USDT directly
      usdtAmountForValidation = parseFloat(amount);
    }

    // Validate USDT limits
    const validation = validateUSDTLimits(usdtAmountForValidation, paymentMethod);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // Check if this is a CDM order and user doesn't have bank details
    if (paymentMethod === 'cdm' && !bankDetails) {
      console.log('📋 CDM order requires bank details - opening modal');
      setShowBankDetailsModal(true)
      return
    }

    await proceedWithOrderCreation()
  }

  // Update the amount input validation (add real-time feedback)
  const getAmountValidationStatus = (): { isValid: boolean; error: string; warning: string } => {
    if (!amount || !paymentMethod) return { isValid: true, error: '', warning: '' };

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return { isValid: true, error: '', warning: '' };

    let usdtAmountForValidation: number;
    if (activeTab === 'buy') {
      usdtAmountForValidation = parseFloat(calculateUSDT(amount));
    } else {
      usdtAmountForValidation = numericAmount;
    }

    const validation = validateUSDTLimits(usdtAmountForValidation, paymentMethod);
    
    if (!validation.isValid) {
      return { isValid: false, error: validation.error, warning: '' };
    }

    // Add warning when approaching limits
    if (paymentMethod === 'upi' && usdtAmountForValidation > UPI_LIMIT_USDT * 0.9) {
      return { 
        isValid: true, 
        error: '', 
        warning: `Approaching UPI limit of ${UPI_LIMIT_USDT} USDT` 
      };
    }

    if (paymentMethod === 'cdm' && usdtAmountForValidation > CDM_MAX_USDT * 0.9) {
      return { 
        isValid: true, 
        error: '', 
        warning: `Approaching CDM limit of ${CDM_MAX_USDT} USDT` 
      };
    }

    return { isValid: true, error: '', warning: '' };
  };

  const amountValidation = getAmountValidationStatus();

  // Update the button disabled condition to include validation
  const isButtonDisabled = !isConnected || 
                          isPlacingOrder || 
                          !amount || 
                          parseFloat(amount) <= 0 || 
                          bankDetailsLoading || 
                          !amountValidation.isValid;

  const proceedWithOrderCreation = async () => {
    setIsPlacingOrder(true)

    try {
      let orderType = ''
      let orderAmount = amount
      let rate = 0

      if (activeTab === 'buy') {
        orderType = paymentMethod === 'cdm' ? 'BUY_CDM' : 'BUY_UPI'
        rate = buyPrice
      } else {
        orderType = paymentMethod === 'cdm' ? 'SELL_CDM' : 'SELL'
        rate = sellPrice
      }

      console.log('🚀 Creating order with parameters:', { 
        orderType, 
        orderAmount, 
        rate,
        activeTab,
        paymentMethod,
        address,
        isConnected
      });

      const order = await createOrder(orderType, orderAmount, rate)

      if (order) {
        console.log('✅ Order created successfully:', {
          id: order.id,
          fullId: order.fullId,
          orderType: order.orderType,
          status: order.status,
          blockchainOrderId: order.blockchainOrderId
        });
        
        // Set current order for modal
        setCurrentOrder(order);
        
        // Save initial modal state and open appropriate modal
        if (activeTab === 'buy' && paymentMethod === 'cdm') {
          saveModalState(order.fullId || order.id, 'BUY_CDM', 0, {}, null);
          setShowBuyCDMModal(true);
        } else if (activeTab === 'buy' && paymentMethod === 'upi') {
          saveModalState(order.fullId || order.id, 'BUY_UPI', 0, {}, null);
          setShowBuyUPIModal(true);
        } else if (activeTab === 'sell' && paymentMethod === 'upi') {
          saveModalState(order.fullId || order.id, 'SELL_UPI', 0, {}, null);
          setShowSellUPIModal(true);
        } else if (activeTab === 'sell' && paymentMethod === 'cdm') {
          saveModalState(order.fullId || order.id, 'SELL_CDM', 0, {}, null);
          setShowSellCDMModal(true);
        }
        
        // Reset form
        setAmount('')
        
        // Refresh orders after successful creation
        await refetchOrders()
      } else {
        console.error('❌ Order creation returned null/undefined');
        throw new Error('Order creation failed - no order returned');
      }
    } catch (error) {
      console.error('💥 Error in order creation:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error details for user:', errorMessage);
      
      // Show alert with detailed error
      alert(`Failed to create order: ${errorMessage}`);
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // Handle bank details save
  const handleSaveBankDetails = async (details: BankDetailsData): Promise<boolean> => {
    console.log('💾 Attempting to save bank details');
    
    const success = await saveBankDetails(details)
    
    if (success) {
      console.log('✅ Bank details saved, proceeding with order');
      setShowBankDetailsModal(false)
      
      // After saving bank details, proceed with order creation
      setTimeout(() => {
        proceedWithOrderCreation()
      }, 500)
    } else {
      console.error('❌ Failed to save bank details');
    }
    
    return success
  }

  const handleCloseBuyCDM = () => {
    setShowBuyCDMModal(false)
    setCurrentOrder(null)
  }

  const handleCloseBuyUPI = () => {
    setShowBuyUPIModal(false)
    setCurrentOrder(null)
  }

  const handleCloseSellUPI = () => {
    setShowSellUPIModal(false)
    setCurrentOrder(null)
  }

  const handleCloseSellCDM = () => {
    setShowSellCDMModal(false)
    setCurrentOrder(null)
  }

  useEffect(() => {
    // Listen for rate updates from admin panel
    const handleRatesUpdated = (event: CustomEvent) => {
      console.log('Rates updated event received:', event.detail)
      // Refresh rates when admin updates them
      setTimeout(() => {
        // Force refetch rates
        window.location.reload() // Simple approach to ensure fresh rates
      }, 1000)
    }
    
    window.addEventListener('ratesUpdated', handleRatesUpdated as EventListener)
    
    return () => {
      window.removeEventListener('ratesUpdated', handleRatesUpdated as EventListener)
    }
  }, [])


  return (
    <>
      <div className="bg-black text-white h-full flex items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="w-full space-y-4">
          {/* Enhanced Wallet Balance Card */}
          <motion.div 
            className="bg-[#101010] max-w-md border border-[#3E3E3E] rounded-md p-4 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isConnected && address ? (
              <div className="space-y-3">
                {/* Wallet Address */}
                <div className="flex justify-center items-center space-x-2 mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#622DBF]/20 flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#622DBF]"/>
                  </div>
                  <span className="text-xs sm:text-sm text-white font-medium">
                    {formatAddress(address)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className='w-3 h-3 sm:w-4 sm:h-4'/>
                  </button>
                  <a
                    href={`https://bscscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>

                {copied && (
                  <motion.div
                    className="text-center text-green-400 text-xs"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    Address copied!
                  </motion.div>
                )}

                {/* Balance Display */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className="text-xs text-white">Available Balance</span>
                    <button
                      onClick={handleRefresh}
                      disabled={walletLoading}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${walletLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {walletLoading ? (
                    <div className="text-lg sm:text-xl font-bold text-gray-400">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {walletData?.balances.usdt 
                          ? `${parseFloat(walletData.balances.usdt.formatted).toFixed(2)} USDT`
                          : '0.00 USDT'
                        }
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center justify-center space-x-1">
                        <span>≈</span>
                        <span>
                          ₹{walletData?.balances.usdt 
                            ? (parseFloat(walletData.balances.usdt.formatted) * buyPrice).toFixed(2)
                            : '0.00'
                          }
                        </span>
                      </div>
                      
                      
                    </>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between text-center pt-3 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400">Total Orders</div>
                    <div className="text-sm font-medium text-white">
                      {ordersLoading ? '...' : orders.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-sm font-medium text-green-400">
                      {ordersLoading ? '...' : orders.filter(o => o.status === 'COMPLETED').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Pending</div>
                    <div className="text-sm font-medium text-yellow-400">
                      {ordersLoading ? '...' : orders.filter(o => ['PENDING', 'ADMIN_APPROVED', 'PAYMENT_SUBMITTED'].includes(o.status)).length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center items-center space-x-2 sm:space-x-3 mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5"/>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">
                    Connect wallet to view balance
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Available Balance</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-500">-- USDT</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Price Display - Centered */}
          <motion.div 
            className="flex justify-center max-w-md space-x-3 sm:space-x-6 mx-auto mb-6 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="border border-[#3E3E3E] rounded-lg p-3 sm:p-4 min-w-[100px] sm:min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <img src="/buy.svg" alt="" className='w-4 h-4 sm:w-5 sm:h-5'/>
                <span className="text-xs sm:text-sm text-white">Buy Price</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-center">
                {ratesLoading ? '...' : `${buyPrice} ₹`}
              </div>
            </div>
            <div className="border border-[#3E3E3E] rounded-md py-3 sm:py-4 px-2 min-w-[100px] sm:min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <img src="/sell.svg" alt="" className='w-4 h-4 sm:w-5 sm:h-5'/>
                <span className="text-xs sm:text-sm text-white">Sell Price</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-center">
                {ratesLoading ? '...' : `${sellPrice} ₹`}
              </div>
            </div>
          </motion.div>

          {/* Buy/Sell Tabs */}
          <motion.div 
            className="flex space-x-3 sm:space-x-6 max-w-lg mx-auto mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.button
              onClick={() => handleTabChange('buy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 sm:py-4 px-6 sm:px-12 rounded-md font-semibold text-base sm:text-lg transition-all ${
                activeTab === 'buy'
                  ? 'bg-[#622DBF] text-white shadow-lg shadow-purple-600/25'
                  : 'bg-[#101010] text-white border border-[#3E3E3E] hover:bg-gray-700/50'
              }`}
            >
              Buy
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('sell')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 sm:py-4 px-6 sm:px-12 rounded-md font-semibold text-base sm:text-lg transition-all ${
                activeTab === 'sell' 
                  ? 'bg-[#622DBF] text-white shadow-lg shadow-purple-600/25' 
                  : 'bg-[#101010] text-white border border-[#3E3E3E] hover:bg-gray-700/50'
              }`}>
              Sell
            </motion.button>
          </motion.div>

          {/* Payment Method Selection */}
          <AnimatePresence>
            {activeTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/30 border border-[#3E3E3E] rounded-md p-4 sm:p-5 mb-6 sm:mb-8 overflow-hidden"
              >
                <h3 className="text-lg sm:text-xl mb-2 text-white">Select how you'd like to {activeTab === 'buy' ? 'pay' : 'receive payment'}</h3>
                <div className="space-y-3 sm:space-y-4">
                  <motion.label 
                    className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all ${
                        paymentMethod === 'upi' 
                          ? 'bg-[#622DBF] border-[#622DBF]' 
                          : 'bg-[#1E1C1C] border-[#3E3E3E]'
                      }`}
                      onClick={() => setPaymentMethod('upi')}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence>
                        {paymentMethod === 'upi' && (
                          <motion.svg 
                            className="w-3 h-3 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img src="/phonepay-gpay.svg" alt="" className="w-6 h-6" />
                      <span className="text-sm sm:text-base font-medium group-hover:text-white transition-colors">
                        {activeTab === 'buy' ? 'Pay with UPI' : 'Receive via UPI'}
                      </span>
                    </div>
                  </motion.label>
                  <motion.label 
                    className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all ${
                        paymentMethod === 'cdm' 
                          ? 'bg-[#622DBF] border-[#622DBF]' 
                          : 'bg-[#1E1C1C] border-[#3E3E3E]'
                      }`}
                      onClick={() => setPaymentMethod('cdm')}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence>
                        {paymentMethod === 'cdm' && (
                          <motion.svg 
                            className="w-3 h-3 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img src="/bank.svg" alt="" className='w-5 h-5 sm:w-6 sm:h-6' />
                      <span className="text-sm sm:text-base font-medium group-hover:text-white transition-colors">
                        {activeTab === 'buy' ? 'Cash Deposit (CDM)' : 'Cash Withdrawal (CDM)'}
                      </span>
                    </div>
                  </motion.label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Amount Input Section */}
          <AnimatePresence>
            {activeTab && paymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#101010] border border-[#3E3E3E] rounded-md p-4 sm:p-5"
              >
                <div className="flex justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-5">
                  <img src={paymentMethod === 'upi' ? "/phonepay-gpay.svg" : "/bank.svg"} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-md text-gray-300 text-center">
                    You are {activeTab === 'buy' ? 'buying' : 'selling'} via {getPaymentMethodName()}
                  </span>
                </div>
                
                <div className="relative mb-4 sm:mb-6 flex justify-center">
                  <span className="absolute left-3 sm:left-65 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl sm:text-3xl">
                    {activeTab === 'buy' ? '₹' : '$'}
                  </span>
                  <motion.input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#1E1C1C] border border-gray-600/50 rounded-xl py-4 sm:py-5 pl-10 sm:pl-12 pr-4 text-xl sm:text-2xl font-medium focus:outline-none focus:border-[#622DBF] focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 w-full max-w-xs"
                    placeholder={activeTab === 'buy' ? "Enter rupees" : "Enter USDT"}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <motion.svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none" 
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: amount ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </motion.svg>
                </div>

                <motion.div 
                  className="text-center"
                  key={activeTab === 'buy' ? usdtAmount : rupeeAmount}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    {activeTab === 'buy' ? `${usdtAmount} USDT` : `₹${rupeeAmount}`}
                  </div>
                  <div className="text-sm text-white">
                    {activeTab === 'buy' 
                      ? `will be credited to your wallet at ₹${buyPrice} per USDT`
                      : `will be transferred to your account at ₹${sellPrice} per USDT`
                    }
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activeTab === 'buy' 
                      ? `Rate: 1 USDT = ₹${buyPrice}`
                      : `Rate: 1 USDT = ₹${sellPrice}`
                    }
                  </div>
                  
                  {/* Add limit information */}
                  <div className="text-xs text-gray-500 mt-2">
                    {paymentMethod === 'upi' && (
                      <>Limit: Max {UPI_LIMIT_USDT} USDT (₹{(UPI_LIMIT_USDT * (activeTab === 'buy' ? buyPrice : sellPrice)).toFixed(0)})</>
                    )}
                    {paymentMethod === 'cdm' && (
                      <>
                        Limits: {CDM_MIN_USDT}-{CDM_MAX_USDT} USDT 
                        (₹{(CDM_MIN_USDT * (activeTab === 'buy' ? buyPrice : sellPrice)).toFixed(0)} - 
                        ₹{(CDM_MAX_USDT * (activeTab === 'buy' ? buyPrice : sellPrice)).toFixed(0)})
                      </>
                    )}
                  </div>

                  {/* Show validation error */}
                  {amountValidation.error && (
                    <motion.div 
                      className="text-xs text-red-400 mt-2 px-2 py-1 bg-red-500/10 rounded border border-red-500/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {amountValidation.error}
                    </motion.div>
                  )}

                  {/* Show validation warning */}
                  {amountValidation.warning && (
                    <motion.div 
                      className="text-xs text-yellow-400 mt-2 px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {amountValidation.warning}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <AnimatePresence>
            {activeTab && paymentMethod && (
              <motion.button 
                onClick={handleBuySellClick}
                disabled={isButtonDisabled}
                className="w-full bg-[#622DBF] hover:bg-purple-700 text-white py-4 sm:py-5 px-6 rounded-xl font-bold text-lg sm:text-xl transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: isButtonDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isButtonDisabled ? 1 : 0.98 }}
                transition={{ duration: 0.3 }}
              >
                {!isConnected 
                  ? 'Connect Wallet to Trade'
                  : bankDetailsLoading
                  ? 'Loading Bank Details...'
                  : amountValidation.error
                  ? 'Amount Exceeds Limits'
                  : isPlacingOrder
                  ? `Placing ${activeTab === 'buy' ? 'Buy' : 'Sell'} Order...`
                  : paymentMethod === 'cdm' && !bankDetails
                  ? `Add Bank Details & ${activeTab === 'buy' ? 'Buy' : 'Sell'}`
                  : activeTab === 'buy'
                  ? `Buy ${amount ? calculateUSDT(amount) : ''} USDT for ₹${amount || '0'}`
                  : `Sell ${amount || '0'} USDT for ₹${amount ? calculateRupee(amount) : '0'}`
                }
              </motion.button>
            )}
          </AnimatePresence>

          {/* How to buy/sell link */}
          <AnimatePresence>
            {activeTab && (
              <motion.div 
                className="text-center pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button 
                  className="flex items-center space-x-2 text-white hover:text-white transition-colors mx-auto group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    whileHover={{ rotate: 15 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                  <span className="font-medium text-sm sm:text-base">How to {activeTab}?</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <BuyCDMModal 
        isOpen={showBuyCDMModal}
        onClose={handleCloseBuyCDM}
        amount={amount}
        usdtAmount={usdtAmount}
        orderData={currentOrder}
      />

      <BuyUPIModal 
        isOpen={showBuyUPIModal}
        onClose={handleCloseBuyUPI}
        amount={amount}
        usdtAmount={usdtAmount}
        orderData={currentOrder}
      />

      <SellUPIModal 
        isOpen={showSellUPIModal}
        onClose={handleCloseSellUPI}
        usdtAmount={amount} // User entered USDT amount
        amount={calculateRupee(amount)} // Calculated rupee amount
        orderData={currentOrder}
      />

      <SellCDMModal 
        isOpen={showSellCDMModal}
        onClose={handleCloseSellCDM}
        usdtAmount={amount} // User entered USDT amount  
        amount={calculateRupee(amount)} // Calculated rupee amount
        orderData={currentOrder}
      />

      <BankDetailsModal
        isOpen={showBankDetailsModal}
        onClose={() => setShowBankDetailsModal(false)}
        onSave={handleSaveBankDetails}
        isLoading={bankDetailsLoading}
      />
    </>
  )
}
async function verifyGasStationApproval(address: string, gasStationAddress: string, finalUsdtAmount: string): Promise<boolean> {
  try {
    console.log('🔍 Verifying Gas Station approval...', {
      userAddress: address,
      gasStationAddress,
      requiredAmount: finalUsdtAmount
    });

    // Check current allowance
    const currentAllowance = await readContract(config as any, {
      address: CONTRACTS.USDT[56],
      abi: USDT_ABI,
      functionName: 'allowance',
      args: [address as `0x${string}`, gasStationAddress as `0x${string}`],
    });

    const requiredAmount = parseUnits(finalUsdtAmount, 18); // BSC USDT uses 18 decimals

    console.log('🔍 Approval verification:', {
      currentAllowance: currentAllowance.toString(),
      requiredAmount: requiredAmount.toString(),
      sufficient: currentAllowance >= requiredAmount
    });

    return currentAllowance >= requiredAmount;
  } catch (error) {
    console.error('❌ Failed to verify Gas Station approval:', error);
    return false;
  }
}

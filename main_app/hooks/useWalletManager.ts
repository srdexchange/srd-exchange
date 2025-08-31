import { useAccount, useBalance, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { bsc, bscTestnet } from 'wagmi/chains'
import { formatUnits, parseUnits, Address } from 'viem'
// Add missing imports
import { readContract, simulateContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/lib/wagmi' // Import your wagmi config

// Contract addresses - Updated to support both networks
const CONTRACTS = {
  USDT: {
    [56]: '0x55d398326f99059fF775485246999027B3197955' as Address, // BSC USDT
    [97]: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' as Address, // BSC Testnet USDT
  },
  P2P_TRADING: {
    [56]: '0x0000000000000000000000000000000000000000' as Address, // Deploy and update
    [97]: '0xE0deDEAC4656F82076ded1B1291e89F94b8a5981' as Address, // Your deployed testnet address
  }
}

// Add decimals ABI for USDT
const USDT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Add decimals function
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const P2P_TRADING_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_usdtAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_inrAmount', type: 'uint256' },
      { internalType: 'string', name: '_orderType', type: 'string' },
    ],
    name: 'createBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_usdtAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_inrAmount', type: 'uint256' },
      { internalType: 'string', name: '_orderType', type: 'string' },
    ],
    name: 'createSellOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'verifyPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'completeBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'completeSellOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'confirmOrderReceived',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'getOrder',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'orderId', type: 'uint256' },
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'uint256', name: 'usdtAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'inrAmount', type: 'uint256' },
          { internalType: 'bool', name: 'isBuyOrder', type: 'bool' },
          { internalType: 'bool', name: 'isCompleted', type: 'bool' },
          { internalType: 'bool', name: 'isVerified', type: 'bool' },
          { internalType: 'bool', name: 'adminApproved', type: 'bool' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'orderType', type: 'string' },
        ],
        internalType: 'struct P2PTrading.Order',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_orderId', type: 'uint256' }],
    name: 'approveOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Helper function to safely convert BigInt to string for JSON serialization
const serializeBigInt = (value: bigint): string => {
  return value.toString()
}

// Helper function to create serializable wallet data
const createSerializableWalletData = (walletInfo: any) => {
  return {
    address: walletInfo.address,
    isConnected: walletInfo.isConnected,
    chainId: walletInfo.chainId,
    isOnBSC: walletInfo.isOnBSC,
    balances: {
      bnb: {
        raw: serializeBigInt(walletInfo.balances.bnb.raw),
        formatted: walletInfo.balances.bnb.formatted,
        symbol: walletInfo.balances.bnb.symbol
      },
      usdt: {
        raw: serializeBigInt(walletInfo.balances.usdt.raw),
        formatted: walletInfo.balances.usdt.formatted,
        symbol: walletInfo.balances.usdt.symbol
      }
    },
    canTrade: walletInfo.canTrade,
    lastUpdated: walletInfo.lastUpdated
  }
}

export function useWalletManager() {
  const { address, isConnected, isConnecting } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Support both BSC mainnet and testnet
  const { data: bnbBalance, refetch: refetchBnb } = useBalance({
    address,
    chainId: chainId
  })

  // Get USDT balance - Support both networks
  const { data: usdtBalance, refetch: refetchUsdt } = useReadContract({
    address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && (chainId === bsc.id || chainId === bscTestnet.id)
    }
  })

  // Get USDT decimals to ensure correct formatting
  const { data: usdtDecimals } = useReadContract({
    address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
    abi: USDT_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!address && (chainId === bsc.id || chainId === bscTestnet.id)
    }
  })

  // Add debugging for USDT balance
  useEffect(() => {
    if (usdtBalance && address) {
      console.log('🔍 USDT Balance Debug:', {
        address,
        chainId,
        contractAddress: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        rawBalance: usdtBalance.toString(),
        decimals: usdtDecimals ? Number(usdtDecimals) : 'unknown',
        formattedWithActualDecimals: usdtDecimals ? formatUnits(usdtBalance, Number(usdtDecimals)) : 'unknown',
        // Test different decimal interpretations
        as6Decimals: formatUnits(usdtBalance, 6),
        as18Decimals: formatUnits(usdtBalance, 18),
      });
    }
  }, [usdtBalance, usdtDecimals, address, chainId])

  // Transaction management
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Add the missing computed values and functions
  const isOnBSC = chainId === bsc.id || chainId === bscTestnet.id

  const switchToBSC = async (): Promise<boolean> => {
    try {
      if (chainId !== bsc.id && chainId !== bscTestnet.id) {
        const targetChainId = process.env.NODE_ENV === 'development' ? bscTestnet.id : bsc.id
        await switchChain({ chainId: targetChainId })
        return true
      }
      return true
    } catch (error) {
      console.error('Failed to switch to BSC:', error)
      return false
    }
  }

  const fetchWalletData = async () => {
    if (!address || !isConnected) return null
    
    setIsLoading(true)
    
    try {
      if (chainId !== bsc.id && chainId !== bscTestnet.id) {
        console.log('Switching to supported BSC network...')
        const targetChainId = process.env.NODE_ENV === 'development' ? bscTestnet.id : bsc.id
        await switchChain({ chainId: targetChainId })
        setIsLoading(false)
        return null
      }

      console.log(`Fetching wallet data for ${chainId === bsc.id ? 'BSC Mainnet' : 'BSC Testnet'}...`)
      
      // Format USDT balance using actual decimals from contract
      let formattedUsdtBalance = '0'
      if (usdtBalance) {
        try {
          // Use actual decimals from the contract
          const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6 // Default to 6 if not available
          formattedUsdtBalance = formatUnits(usdtBalance, actualDecimals)
          
          console.log('✅ USDT balance formatted:', {
            raw: usdtBalance.toString(),
            decimals: actualDecimals,
            formatted: formattedUsdtBalance
          })
        } catch (error) {
          console.error('❌ Error formatting USDT balance:', error)
          formattedUsdtBalance = '0'
        }
      }
      
      const walletInfo = {
        address,
        chainId,
        isOnBSC: chainId === bsc.id || chainId === bscTestnet.id,
        balances: {
          bnb: {
            raw: bnbBalance?.value || BigInt(0),
            formatted: bnbBalance ? formatUnits(bnbBalance.value, 18) : '0',
            symbol: chainId === bsc.id ? 'BNB' : 'tBNB'
          },
          usdt: {
            raw: usdtBalance || BigInt(0),
            formatted: formattedUsdtBalance,
            symbol: 'USDT'
          }
        },
        canTrade: (bnbBalance?.value || BigInt(0)) > parseUnits('0.001', 18),
        lastUpdated: new Date().toISOString()
      }

      console.log('💰 Final wallet info:', {
        address: walletInfo.address,
        usdtFormatted: walletInfo.balances.usdt.formatted,
        bnbFormatted: walletInfo.balances.bnb.formatted,
        canTrade: walletInfo.canTrade
      })

      setWalletData(walletInfo)
      
      return createSerializableWalletData(walletInfo)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // P2P Trading Contract Functions
  const createBuyOrderOnChain = async (usdtAmount: string, inrAmount: string, orderType: string) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6
    const usdtAmountWei = parseUnits(usdtAmount, actualDecimals)
    const inrAmountWei = parseUnits(inrAmount, 2)
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'createBuyOrder',
      args: [usdtAmountWei, inrAmountWei, orderType],
    })
  }

  const createSellOrderOnChain = async (usdtAmount: string, inrAmount: string, orderType: string) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    console.log('🔗 Creating sell order on blockchain:', {
      usdtAmount,
      inrAmount,
      orderType,
      userAddress: address
    })
    
    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6
    const usdtAmountWei = parseUnits(usdtAmount, actualDecimals)
    const inrAmountWei = parseUnits(inrAmount, 2)
    
    console.log('💰 Checking USDT balance and allowance...')
    
    // Check user's USDT balance using readContract from @wagmi/core
    const userBalance = await readContract(config as any, {
      address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
      abi: USDT_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
    
    console.log('User USDT balance:', formatUnits(userBalance, actualDecimals))
    
    if (userBalance < usdtAmountWei) {
      throw new Error(`Insufficient USDT balance. Required: ${usdtAmount}, Available: ${formatUnits(userBalance, actualDecimals)}`)
    }
    
    // Check allowance
    const allowance = await readContract(config as any, {
      address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
      abi: USDT_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING]],
    })
    
    console.log('Current allowance:', formatUnits(allowance, actualDecimals))
    
    // If allowance is insufficient, approve first
    if (allowance < usdtAmountWei) {
      console.log('🔓 Approving USDT transfer...')
      
      writeContract({
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: 'approve',
        args: [CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING], usdtAmountWei],
      })
      
      // Wait for approval transaction if hash is available
      if (hash) {
        await waitForTransactionReceipt(config as any, { hash })
      }
      
      console.log('✅ USDT approval initiated')
    }
    
    // Now create the sell order (this will transfer USDT to contract)
    console.log('📝 Creating sell order on contract...')
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'createSellOrder',
      args: [usdtAmountWei, inrAmountWei, orderType],
    })
  }

  // Admin functions
  const verifyPaymentOnChain = async (orderId: number) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'verifyPayment',
      args: [BigInt(orderId)],
    })
  }

  const completeBuyOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    console.log('🔗 Completing buy order on chain for order ID:', orderId)
    
    if (!orderId || isNaN(orderId) || orderId <= 0) {
      throw new Error(`Invalid order ID: ${orderId}. Must be a positive integer.`)
    }

    try {
      // First, get the order details to know how much USDT we need
      const orderDetails = await readContract(config as any, {
        address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: 'getOrder',
        args: [BigInt(orderId)],
      })

      const usdtAmountNeeded = orderDetails.usdtAmount
      console.log('📊 Order requires USDT amount:', formatUnits(usdtAmountNeeded, 6))

      // Check admin's USDT balance
      const adminBalance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: 'balanceOf',
        args: [address],
      })

      console.log('💰 Admin USDT balance:', formatUnits(adminBalance, 6))

      if (adminBalance < usdtAmountNeeded) {
        throw new Error(`Insufficient USDT balance. Required: ${formatUnits(usdtAmountNeeded, 6)}, Available: ${formatUnits(adminBalance, 6)}`)
      }

      // Check current allowance
      const currentAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: 'allowance',
        args: [address, CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING]],
      })

      console.log('🔍 Current allowance:', formatUnits(currentAllowance, 6))

      // If allowance is insufficient, approve first
      if (currentAllowance < usdtAmountNeeded) {
        console.log('🔓 Approving USDT for P2P contract...')
        
        writeContract({
          address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
          abi: USDT_ABI,
          functionName: 'approve',
          args: [CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING], usdtAmountNeeded],
        })
        
        // Wait for the approval transaction to complete
        if (hash) {
          await waitForTransactionReceipt(config as any, { hash })
        }
        
        console.log('✅ USDT approval successful')
      }

      // Now complete the buy order
      console.log('📝 Completing buy order on contract...')
      
      writeContract({
        address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: 'completeBuyOrder',
        args: [BigInt(orderId)],
      })

    } catch (error) {
      console.error('❌ Error in completeBuyOrderOnChain:', error)
      throw new Error(`Failed to complete buy order: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const completeSellOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'completeSellOrder',
      args: [BigInt(orderId)],
    })
  }

  const confirmOrderReceivedOnChain = async (orderId: number) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'confirmOrderReceived',
      args: [BigInt(orderId)],
    })
  }

  // Add this function to the P2P Trading functions section:
  const approveOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    console.log('🔗 Approving order on chain for order ID:', orderId)
    
    if (!orderId || isNaN(orderId) || orderId <= 0) {
      throw new Error(`Invalid order ID: ${orderId}. Must be a positive integer.`)
    }
    
    try {
      writeContract({
        address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: 'approveOrder',
        args: [BigInt(orderId)],
      })
    } catch (error) {
      console.error('❌ Error in approveOrderOnChain:', error)
      throw new Error(`Failed to approve order: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // USDT functions
  const transferUSDT = async (to: Address, amount: string) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6
    const amountWei = parseUnits(amount, actualDecimals)
    
    writeContract({
      address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
      abi: USDT_ABI,
      functionName: 'transfer',
      args: [to, amountWei],
    })
  }

  const approveUSDT = async (spender: Address, amount: string) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6
    const amountWei = parseUnits(amount, actualDecimals)
    
    writeContract({
      address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
      abi: USDT_ABI,
      functionName: 'approve',
      args: [spender, amountWei],
    })
  }

  // Auto-fetch wallet data when connected and on supported BSC networks
  useEffect(() => {
    if (isConnected && address && (chainId === bsc.id || chainId === bscTestnet.id)) {
      fetchWalletData()
    } else if (isConnected && address && chainId !== bsc.id && chainId !== bscTestnet.id) {
      setWalletData({
        address,
        chainId,
        balances: {
          bnb: { raw: '0', formatted: '0', symbol: 'BNB' },
          usdt: { raw: '0', formatted: '0', symbol: 'USDT' }
        },
        canTrade: false,
        lastUpdated: new Date().toISOString()
      })
    }
  }, [isConnected, address, chainId, bnbBalance, usdtBalance])

  const refetchBalances = async () => {
    if (chainId === bsc.id || chainId === bscTestnet.id) {
      await Promise.all([refetchBnb(), refetchUsdt()])
      await fetchWalletData()
    }
  }

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    walletData,
    isLoading: isLoading || isPending || isConfirming,
    fetchWalletData,
    refetchBalances,
    switchChain,
    isOnBSC,
    switchToBSC,
    canTrade: walletData?.canTrade || false,
    // Contract interactions
    createBuyOrderOnChain,
    createSellOrderOnChain,
    verifyPaymentOnChain,
    completeBuyOrderOnChain,
    completeSellOrderOnChain,
    confirmOrderReceivedOnChain,
    approveOrderOnChain, // Make sure this is included
    // USDT functions
    transferUSDT,
    approveUSDT,
    // Transaction status
    hash,
    isPending,
    isConfirming
  }
}
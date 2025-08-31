import { useAccount, useBalance, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { bsc, bscTestnet } from 'wagmi/chains'
import { formatUnits, parseUnits, Address } from 'viem'

// Contract addresses - Updated to support both networks
const CONTRACTS = {
  USDT: {
    [56]: '0x55d398326f99059fF775485246999027B3197955' as Address, // BSC USDT
    [97]: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' as Address, // BSC Testnet USDT
  },
  P2P_TRADING: {
    [56]: '0x0000000000000000000000000000000000000000' as Address, // Deploy and update
    [97]: '0x0000000000000000000000000000000000000000' as Address, // Deploy and update
  }
}

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
    chainId: chainId // Use current chainId instead of hardcoded bsc.id
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

  // Transaction management
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Add the missing computed values and functions
  const isOnBSC = chainId === bsc.id || chainId === bscTestnet.id

  const switchToBSC = async (): Promise<boolean> => {
    try {
      if (chainId !== bsc.id && chainId !== bscTestnet.id) {
        // Default to testnet for development, mainnet for production
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
      // Support both BSC mainnet and testnet
      if (chainId !== bsc.id && chainId !== bscTestnet.id) {
        console.log('Switching to supported BSC network...')
        const targetChainId = process.env.NODE_ENV === 'development' ? bscTestnet.id : bsc.id
        await switchChain({ chainId: targetChainId })
        setIsLoading(false)
        return null
      }

      console.log(`Fetching wallet data for ${chainId === bsc.id ? 'BSC Mainnet' : 'BSC Testnet'}...`)
      
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
            formatted: usdtBalance ? formatUnits(usdtBalance, 6) : '0',
            symbol: 'USDT'
          }
        },
        canTrade: (bnbBalance?.value || BigInt(0)) > parseUnits('0.001', 18),
        lastUpdated: new Date().toISOString()
      }

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
    
    const usdtAmountWei = parseUnits(usdtAmount, 6) // USDT has 6 decimals
    const inrAmountWei = parseUnits(inrAmount, 2) // INR with 2 decimals for precision
    
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
    
    const usdtAmountWei = parseUnits(usdtAmount, 6)
    const inrAmountWei = parseUnits(inrAmount, 2)
    
    // First approve USDT transfer
    await approveUSDT(CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING], usdtAmount)
    
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
    
    writeContract({
      address: CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: 'completeBuyOrder',
      args: [BigInt(orderId)],
    })
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

  // USDT functions
  const transferUSDT = async (to: Address, amount: string) => {
    if (!address) throw new Error('Wallet not connected')
    if (!isOnBSC) throw new Error('Please switch to a supported BSC network')
    
    const amountWei = parseUnits(amount, 6) // USDT has 6 decimals
    
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
    
    const amountWei = parseUnits(amount, 6)
    
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
    // Add these missing exports
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
    // USDT functions
    transferUSDT,
    approveUSDT,
    // Transaction status
    hash,
    isPending,
    isConfirming
  }
}
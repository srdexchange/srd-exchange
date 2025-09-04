import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { bsc } from 'viem/chains'
import { writeContract, readContract, simulateContract } from 'viem/actions'


const GAS_STATION_PRIVATE_KEY = process.env.GAS_STATION_PRIVATE_KEY as `0x${string}`
const GAS_STATION_ENABLED = process.env.NEXT_PUBLIC_GAS_STATION_ENABLED === 'true'


const BSC_RPC_URLS = [
  'https://bsc.nodereal.io',
  'https://bsc-dataseed.bnbchain.org',
  'https://rpc.ankr.com/bsc', 
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
  'https://bsc-dataseed2.defibit.io', 
]


const createTransportWithFallback = (rpcIndex = 0) => {
  const currentRpc = BSC_RPC_URLS[rpcIndex] || BSC_RPC_URLS[0]
  
  return http(currentRpc, {
    batch: false, 
    timeout: 8000, 
    retryCount: 1, 
    retryDelay: 1000 
  })
}


const createResilientTransport = () => {
  let currentRpcIndex = 0
  
  const tryNextRpc = () => {
    if (currentRpcIndex < BSC_RPC_URLS.length - 1) {
      currentRpcIndex++
      return createTransportWithFallback(currentRpcIndex)
    }
    // If all RPCs fail, start over with first one
    currentRpcIndex = 0
    return createTransportWithFallback(0)
  }
  
  return createTransportWithFallback(currentRpcIndex)
}

console.log('🔧 Gas Station Configuration (BSC Mainnet Only):', {
  enabled: GAS_STATION_ENABLED,
  hasPrivateKey: !!GAS_STATION_PRIVATE_KEY,
  privateKeyLength: GAS_STATION_PRIVATE_KEY?.length || 0,
  targetChain: 'BSC Mainnet (56)',
  rpcEndpoints: BSC_RPC_URLS.length,
  primaryRpc: BSC_RPC_URLS[0],
  timeout: '8s with fallback'
})

if (!GAS_STATION_PRIVATE_KEY && GAS_STATION_ENABLED) {
  throw new Error('GAS_STATION_PRIVATE_KEY is required when gas station is enabled')
}


const CONTRACTS = {
  USDT: {
    [56]: '0x55d398326f99059fF775485246999027B3197955' as Address,
  },
  P2P_TRADING: {
    [56]: '0xD64d78dCFc550F131813a949c27b2b439d908F54' as Address,
  }
}


const USDT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

class GasStationService {
  private account: any
  private walletClient: any
  private publicClient: any
  private chainId: number = 56
  private isInitialized: boolean = false
  private currentRpcIndex: number = 0

  constructor() {
    console.log(`🚀 Initializing Gas Station for BSC Mainnet with ${BSC_RPC_URLS.length} RPC endpoints...`)
    
    if (GAS_STATION_ENABLED && GAS_STATION_PRIVATE_KEY) {
      try {
        this.account = privateKeyToAccount(GAS_STATION_PRIVATE_KEY)
        this.initializeClients()
        this.isInitialized = true
        
        console.log('✅ Gas Station initialized for BSC Mainnet')
        console.log('📍 Gas Station Address:', this.account.address)
        console.log('🔗 Chain ID:', this.chainId, '(BSC Mainnet)')
        console.log('🌐 RPC Endpoints:', BSC_RPC_URLS.length)
        
      } catch (error) {
        console.error('❌ Failed to initialize Gas Station:', error)
        this.isInitialized = false
      }
    } else {
      console.log('⚠️ Gas Station disabled or not configured')
    }
  }

  private initializeClients() {
 
    const optimizedBSC = {
      ...bsc,
      rpcUrls: {
        default: { http: BSC_RPC_URLS },
        public: { http: BSC_RPC_URLS }
      }
    }
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: optimizedBSC,
      transport: createResilientTransport()
    })
    
    this.publicClient = createPublicClient({
      chain: optimizedBSC,
      transport: createResilientTransport()
    })
  }


  private switchToNextRpc() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % BSC_RPC_URLS.length
    console.log(`🔄 Switching to RPC ${this.currentRpcIndex + 1}/${BSC_RPC_URLS.length}: ${BSC_RPC_URLS[this.currentRpcIndex]}`)
    this.initializeClients()
  }

  private getContractAddress(contractType: 'USDT' | 'P2P_TRADING'): Address {
    const address = CONTRACTS[contractType][56]
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`${contractType} contract not deployed on BSC mainnet`)
    }
    return address
  }

 isReady(): boolean {
    return this.isInitialized && !!this.account
  }

  getAddress(): string {
    return this.account?.address || ''
  }


  async userSellOrderViaGasStation(
    userAddress: Address,
    adminAddress: Address,
    usdtAmount: string,
    inrAmount: number,
    orderType: string,
    maxRetries = 3
  ): Promise<string> {
    console.log('💸 Gas Station USDT transfer with RPC fallback...')
    
    if (!GAS_STATION_ENABLED) {
      throw new Error('Gas Station is disabled')
    }

    if (!this.isInitialized || !this.account) {
      throw new Error('Gas Station not initialized. Please check configuration.')
    }

    console.log('💸 Gas Station transfer (with failover):', {
      userAddress,
      adminAddress,
      usdtAmount,
      inrAmount,
      orderType,
      gasStation: this.account.address,
      maxRetries,
      currentRpc: BSC_RPC_URLS[this.currentRpcIndex]
    })

    let lastError: any = null


    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Transfer attempt ${attempt}/${maxRetries} using RPC: ${BSC_RPC_URLS[this.currentRpcIndex]}`)
        
      
        const usdtDecimals = 18
        const usdtAmountWei = parseUnits(usdtAmount, usdtDecimals)

        console.log('📝 Executing Gas Station USDT transferFrom:', {
          attempt,
          amount: usdtAmount,
          amountWei: usdtAmountWei.toString(),
          from: userAddress,
          to: adminAddress,
          rpc: BSC_RPC_URLS[this.currentRpcIndex]
        })

        
        const hash = await writeContract(this.walletClient, {
          address: this.getContractAddress('USDT'),
          abi: USDT_ABI,
          functionName: 'transferFrom',
          args: [userAddress, adminAddress, usdtAmountWei],
          account: this.account,
          chain: undefined,
          gas: BigInt(100000), 
          gasPrice: BigInt(1000000000) 
        })

        console.log(`✅ Gas Station transfer successful on attempt ${attempt}:`, hash)
        return hash
        
      } catch (error) {
        lastError = error
        console.error(`❌ Transfer attempt ${attempt} failed:`, error)
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Check if it's a timeout/network error
        if (errorMessage.includes('timeout') || 
            errorMessage.includes('aborted') || 
            errorMessage.includes('HTTP request failed') ||
            errorMessage.includes('fetch failed')) {
          
          console.log(`🔄 Network error on attempt ${attempt}, trying next RPC...`)
          
          // Switch to next RPC for next attempt
          if (attempt < maxRetries) {
            this.switchToNextRpc()
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2s before retry
            continue
          }
        } else {
          // Non-network error (like insufficient approval), don't retry
          console.error(`❌ Non-network error, not retrying:`, errorMessage)
          break
        }
      }
    }

    // All attempts failed
    console.error('❌ All Gas Station transfer attempts failed')
    throw lastError || new Error('Gas Station transfer failed after all attempts')
  }

  // 🔥 ENHANCED: Admin transfer with RPC fallback
  async adminTransferUSDT(
    adminAddress: Address,
    userAddress: Address,
    usdtAmount: string,
    maxRetries = 3
  ): Promise<string> {
    console.log('💸 Gas Station admin USDT transfer with RPC fallback...')
    
    if (!GAS_STATION_ENABLED) {
      throw new Error('Gas Station is disabled')
    }

    if (!this.isInitialized || !this.account) {
      throw new Error('Gas Station not initialized. Please check configuration.')
    }

    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Admin transfer attempt ${attempt}/${maxRetries} using RPC: ${BSC_RPC_URLS[this.currentRpcIndex]}`)
        
        const usdtDecimals = 18 // BSC USDT uses 18 decimals
        const usdtAmountWei = parseUnits(usdtAmount, usdtDecimals)

        console.log('📝 Executing admin USDT transferFrom via Gas Station:', {
          attempt,
          amount: usdtAmount,
          amountWei: usdtAmountWei.toString(),
          from: adminAddress,
          to: userAddress,
          rpc: BSC_RPC_URLS[this.currentRpcIndex]
        })
        
        const hash = await writeContract(this.walletClient, {
          address: this.getContractAddress('USDT'),
          abi: USDT_ABI,
          functionName: 'transferFrom',
          args: [adminAddress, userAddress, usdtAmountWei],
          account: this.account,
          chain: undefined,
          gas: BigInt(100000),
          gasPrice: BigInt(1500000000) // 1.5 gwei
        })

        console.log(`✅ Admin transfer successful on attempt ${attempt}:`, hash)
        return hash
        
      } catch (error) {
        lastError = error
        console.error(`❌ Admin transfer attempt ${attempt} failed:`, error)
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        if (errorMessage.includes('timeout') || 
            errorMessage.includes('aborted') || 
            errorMessage.includes('HTTP request failed') ||
            errorMessage.includes('fetch failed')) {
          
          if (attempt < maxRetries) {
            this.switchToNextRpc()
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
        } else {
          break
        }
      }
    }

    throw lastError || new Error('Admin transfer failed after all attempts')
  }

  // 🔥 STREAMLINED: Basic validation with timeout protection  
  async validateUserApproval(userAddress: Address, usdtAmount: string): Promise<{ hasBalance: boolean; hasApproval: boolean }> {
    if (!this.isInitialized) {
      return { hasBalance: false, hasApproval: false }
    }

    try {
      const usdtAmountWei = parseUnits(usdtAmount, 18)
      
      // 🔥 Use Promise.race for timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Validation timeout')), 3000)
      )

      const validationPromise = Promise.all([
        readContract(this.publicClient, {
          address: this.getContractAddress('USDT'),
          abi: USDT_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }),
        readContract(this.publicClient, {
          address: this.getContractAddress('USDT'),
          abi: USDT_ABI,
          functionName: 'allowance',
          args: [userAddress, this.account.address]
        })
      ])

      const [userBalance, userAllowance] = await Promise.race([
        validationPromise,
        timeoutPromise
      ]) as [bigint, bigint]

      const hasBalance = userBalance >= usdtAmountWei
      const hasApproval = userAllowance >= usdtAmountWei

      console.log('✅ Quick validation completed:', {
        hasBalance,
        hasApproval,
        userBalance: formatUnits(userBalance, 18),
        userAllowance: formatUnits(userAllowance, 18),
        required: usdtAmount
      })

      return { hasBalance, hasApproval }

    } catch (error) {
      console.warn('⚠️ Validation failed/timeout, assuming user is ready:', error)
      // If validation fails, assume user is ready (Gas Station will find out during execution)
      return { hasBalance: true, hasApproval: true }
    }
  }
}

// Create singleton instance for mainnet only
export const gasStationMainnet = new GasStationService()

// Helper function to get gas station (always returns mainnet)
export function getGasStation(chainId?: number): GasStationService {
  if (chainId && chainId !== 56) {
    console.warn(`⚠️ Requested chainId ${chainId} but only BSC Mainnet (56) is supported. Using mainnet.`)
  }
  return gasStationMainnet
}

// Export for API routes
export { GasStationService }
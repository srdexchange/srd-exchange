import { NextRequest, NextResponse } from 'next/server'
import { getGasStation } from '@/lib/gasStation'

export async function POST(request: NextRequest) {
  try {
    const { adminAddress, userAddress, usdtAmount, chainId } = await request.json()
    
    // Force mainnet validation
    if (chainId !== 56) {
      console.error(`❌ Invalid chainId: ${chainId}. Only BSC Mainnet (56) is supported.`)
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid network. Only BSC Mainnet (Chain ID 56) is supported. Received: ${chainId}` 
        },
        { status: 400 }
      )
    }
    
    if (!adminAddress || !userAddress || !usdtAmount) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: adminAddress, userAddress, usdtAmount' 
        },
        { status: 400 }
      )
    }
    
    console.log('🚀 Gas Station admin transfer request (BSC Mainnet):', {
      adminAddress,
      userAddress,
      usdtAmount,
      chainId: 56 // Force mainnet
    })
    
    // Always use mainnet gas station
    const gasStation = getGasStation(56)
    
    // 🔥 FIX: Use isReady() instead of checkGasStationStatus()
    if (!gasStation.isReady()) {
      console.error('❌ Gas Station not ready on BSC Mainnet')
      return NextResponse.json(
        { 
          success: false,
          error: 'Gas Station not ready on BSC Mainnet. Please try again later.' 
        },
        { status: 503 }
      )
    }
    
    console.log('✅ Gas Station is ready, executing admin USDT transfer...')
    
    // Execute transfer
    const txHash = await gasStation.adminTransferUSDT(
      adminAddress,
      userAddress,
      usdtAmount
    )
    
    console.log('✅ Gas Station admin transfer successful (BSC Mainnet):', txHash)
    
    return NextResponse.json({
      success: true,
      txHash,
      chainId: 56,
      gasStationAddress: gasStation.getAddress(),
      message: 'USDT transfer completed via Gas Station on BSC Mainnet'
    })
    
  } catch (error) {
    console.error('❌ Gas Station admin transfer error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Gas Station admin transfer failed' 
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getGasStation } from '@/lib/gasStation'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, usdtAmount, inrAmount, orderType, adminWallet, chainId } = await request.json()
    
    // Force mainnet validation
    if (chainId !== 56) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid network. Only BSC Mainnet (Chain ID 56) is supported. Received: ${chainId}` 
        },
        { status: 400 }
      )
    }
    
    if (!userAddress || !usdtAmount || !inrAmount || !orderType || !adminWallet) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters: userAddress, usdtAmount, inrAmount, orderType, adminWallet' 
        },
        { status: 400 }
      )
    }
    
    console.log('🔄 Gas Station direct sell transfer request (BSC Mainnet):', {
      userAddress,
      usdtAmount,
      inrAmount,
      orderType,
      adminWallet,
      chainId: 56
    })
    
    const gasStation = getGasStation(56)
    
    if (!gasStation.isReady()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Gas Station not ready on BSC Mainnet. Please try again later.' 
        },
        { status: 503 }
      )
    }
    
    // Execute direct sell transfer using our streamlined userSellOrderViaGasStation
    const txHash = await gasStation.userSellOrderViaGasStation(
      userAddress as `0x${string}`,
      adminWallet as `0x${string}`,
      usdtAmount,
      parseFloat(inrAmount.toString()),
      orderType
    )
    
    console.log('✅ Gas Station direct sell transfer successful (BSC Mainnet):', txHash)
    
    return NextResponse.json({
      success: true,
      txHash,
      chainId: 56,
      gasStationAddress: gasStation.getAddress(),
      message: 'Direct sell transfer completed via Gas Station on BSC Mainnet'
    })
    
  } catch (error) {
    console.error('❌ Gas Station direct sell transfer error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Direct sell transfer failed' 
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getGasStation } from '@/lib/gasStation'

export async function POST(request: NextRequest) {
  try {
    const { 
      userAddress, 
      adminAddress, 
      usdtAmount, 
      inrAmount, 
      orderType,
      chainId
    } = await request.json()
    
    if (chainId !== 56) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Only BSC Mainnet (Chain ID 56) is supported',
          code: 'INVALID_NETWORK'
        },
        { status: 400 }
      )
    }
    
    if (!userAddress || !adminAddress || !usdtAmount || !inrAmount || !orderType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters',
          code: 'MISSING_PARAMS' 
        },
        { status: 400 }
      )
    }

    console.log('🚀 Complete gasless sell order request:', {
      userAddress,
      adminAddress,
      usdtAmount,
      inrAmount,
      orderType,
      chainId
    })
    
    const gasStation = getGasStation(56)
    
    if (!gasStation.isReady()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Gas Station not ready. Please try again later.',
          code: 'GAS_STATION_NOT_READY'
        },
        { status: 503 }
      )
    }

    console.log('✅ Gas Station ready, executing complete gasless sell...')
    
    // Execute the complete gasless sell order
    const result = await gasStation.completeGaslessSellOrder(
      userAddress as `0x${string}`,
      adminAddress as `0x${string}`,
      usdtAmount,
      inrAmount,
      orderType
    )
    
    if (result.needsApproval) {
      return NextResponse.json({
        success: false,
        needsApproval: true,
        code: 'USER_NEEDS_APPROVAL',
        message: 'User needs to approve Gas Station for USDT spending first.'
      })
    }
    
    console.log('✅ Complete gasless sell order successful:', result.txHash)
    
    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      chainId: 56,
      gasStationAddress: gasStation.getAddress(),
      method: 'complete_gasless',
      gasPaidBy: 'Gas Station',
      userGasCost: '0 BNB',
      message: 'Transaction completed - Gas Station paid all gas fees!'
    })
    
  } catch (error) {
    console.error('❌ Complete gasless sell error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Complete gasless sell failed'
    
    if (errorMessage.includes('Insufficient USDT balance')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient USDT balance for this transaction.',
          code: 'INSUFFICIENT_BALANCE'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        code: 'GASLESS_SELL_FAILED'
      },
      { status: 500 }
    )
  }
}
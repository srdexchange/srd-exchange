import { NextRequest, NextResponse } from 'next/server'
import { getGasStation } from '@/lib/gasStation'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, chainId } = await request.json()
    
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
    
    if (!userAddress) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing userAddress parameter',
          code: 'MISSING_PARAMS' 
        },
        { status: 400 }
      )
    }

    console.log('💰 Gas Station funding user approval:', {
      userAddress,
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

    console.log('✅ Gas Station ready, funding user approval...')
    
    // Send gas to user for approval transaction
    const txHash = await gasStation.payForUserApproval(
      userAddress as `0x${string}`
    )
    
    console.log('✅ User approval funded:', txHash)
    
    return NextResponse.json({
      success: true,
      txHash,
      chainId: 56,
      gasStationAddress: gasStation.getAddress(),
      fundedAmount: '0.001 BNB',
      message: 'Gas Station funded your approval transaction - now approve Gas Station for USDT'
    })
    
  } catch (error) {
    console.error('❌ Gas funding error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Gas funding failed'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        code: 'GAS_FUNDING_FAILED'
      },
      { status: 500 }
    )
  }
}
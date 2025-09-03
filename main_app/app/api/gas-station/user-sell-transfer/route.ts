import { NextRequest, NextResponse } from 'next/server'
import { getGasStation } from '@/lib/gasStation'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, adminAddress, usdtAmount, inrAmount, orderType, chainId } = await request.json()
    
    if (chainId !== 56) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid network. Only BSC Mainnet (Chain ID 56) is supported. Received: ${chainId}`,
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
    
    console.log('🔄 Gas Station user sell transfer request (BSC Mainnet):', {
      userAddress,
      adminAddress,
      usdtAmount,
      inrAmount,
      orderType,
      chainId: 56
    })
    
    const gasStation = getGasStation(56)
    
    try {
      console.log('🚀 Executing Gas Station transfer (Gas Station pays ALL gas fees)...')
      
      const txHash = await gasStation.userSellOrderViaGasStation(
        userAddress as `0x${string}`,
        adminAddress as `0x${string}`,
        usdtAmount,
        inrAmount,
        orderType
      )
      
      console.log('✅ Gas Station user sell transfer successful (BSC Mainnet):', txHash)
      
      return NextResponse.json({
        success: true,
        txHash,
        chainId: 56,
        gasStationAddress: gasStation.getAddress(),
        message: 'Gas Station paid all gas fees for this transfer'
      })
      
    } catch (transferError) {
      console.error('❌ Gas Station transfer error:', transferError)
      
      const errorMessage = transferError instanceof Error ? transferError.message : 'Transfer failed'
      
      // 🔥 FIX: Better error handling based on error type
      if (errorMessage.includes('APPROVAL_REQUIRED')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User has not approved Gas Station for USDT spending. Please approve Gas Station first.',
            needsApproval: true,
            code: 'APPROVAL_REQUIRED'
          },
          { status: 400 }
        )
      }
      
      if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User has insufficient USDT balance for this transaction',
            code: 'INSUFFICIENT_BALANCE'
          },
          { status: 400 }
        )
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('429')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Network temporarily busy. Please try again in a moment.',
            retryable: true,
            code: 'NETWORK_BUSY'
          },
          { status: 503 }
        )
      }
      
      // Generic error
      return NextResponse.json(
        { 
          success: false,
          error: `Gas Station transfer failed: ${errorMessage}`,
          code: 'TRANSFER_FAILED'
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Gas Station user sell transfer API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
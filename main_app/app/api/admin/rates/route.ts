import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple admin verification function (you can enhance this later)
async function verifyAdminAccess(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return { user }
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { currency, buyRate, sellRate } = await request.json()

    if (!currency || !buyRate || !sellRate) {
      return NextResponse.json(
        { error: 'Currency, buyRate, and sellRate are required' },
        { status: 400 }
      )
    }

    // Validate rates
    if (parseFloat(buyRate) <= 0 || parseFloat(sellRate) <= 0) {
      return NextResponse.json(
        { error: 'Rates must be positive numbers' },
        { status: 400 }
      )
    }

    console.log(`Admin updating ${currency} rates - Buy: ${buyRate}, Sell: ${sellRate}`)

    // Update or create the rate
    const updatedRate = await prisma.rate.upsert({
      where: {
        type_currency: {
          type: 'CURRENT',
          currency: currency
        }
      },
      update: {
        buyRate: parseFloat(buyRate),
        sellRate: parseFloat(sellRate),
        updatedBy: authResult.user.id,
        updatedAt: new Date()
      },
      create: {
        type: 'CURRENT',
        currency: currency,
        buyRate: parseFloat(buyRate),
        sellRate: parseFloat(sellRate),
        updatedBy: authResult.user.id
      }
    })

    console.log('Rate updated successfully:', updatedRate)

    return NextResponse.json({ 
      success: true, 
      rate: updatedRate,
      message: `${currency} rates updated successfully`
    })
  } catch (error) {
    console.error('Error updating rates:', error)
    return NextResponse.json(
      { error: 'Failed to update rates' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const rates = await prisma.rate.findMany({
      where: {
        type: 'CURRENT'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Error fetching admin rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    )
  }
}
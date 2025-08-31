import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
                upiId: true,
                bankDetails: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const transformedOrders = user.orders.map(order => ({
      id: `#${order.id.slice(-6)}`,
      fullId: order.id,
      time: formatTime(order.createdAt),
      amount: Number(order.amount), // Rupees
      usdtAmount: order.usdtAmount ? Number(order.usdtAmount) : null, // USDT
      type: getOrderTypeLabel(order.orderType),
      orderType: order.orderType,
      price: Number(order.buyRate || order.sellRate || 0),
      currency: order.orderType === 'BUY_CDM' ? 'CDM' : 'UPI',
      status: order.status,
      user: order.user,
      createdAt: order.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const { 
      walletAddress, 
      orderType, 
      amount, 
      usdtAmount, 
      buyRate, 
      sellRate, 
      paymentMethod,
      blockchainOrderId,
      orderId
    } = await request.json()

    // Validation
    if (!walletAddress || !orderType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating order:', {
      walletAddress,
      orderType,
      amount: `₹${amount}`,
      usdtAmount: `${usdtAmount} USDT`,
      rate: buyRate || sellRate
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { 
          walletAddress: walletAddress.toLowerCase(),
          role: 'USER'
        }
      })
    }

    // Create order with proper amounts
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderType,
        amount: parseFloat(amount),
        usdtAmount: usdtAmount ? parseFloat(usdtAmount) : null,
        buyRate: buyRate ? parseFloat(buyRate) : null,
        sellRate: sellRate ? parseFloat(sellRate) : null,
        blockchainOrderId: blockchainOrderId || null, // Add this
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            upiId: true,
            bankDetails: true
          }
        }
      }
    })

    // Transform for frontend
    const transformedOrder = {
      id: `#${order.id.slice(-6)}`,
      fullId: order.id,
      time: formatTime(order.createdAt),
      amount: Number(order.amount), // Rupees
      usdtAmount: Number(order.usdtAmount), // USDT
      type: getOrderTypeLabel(order.orderType),
      orderType: order.orderType,
      price: Number(order.buyRate || order.sellRate || 0),
      currency: order.orderType === 'BUY_CDM' ? 'CDM' : 'UPI',
      status: order.status,
      user: order.user,
      createdAt: order.createdAt
    }

    console.log('Order created successfully:', transformedOrder);

    return NextResponse.json({
      success: true,
      order: transformedOrder
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PUT - Update order (user can update payment proof, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentProof, transactionId } = body

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    // TODO: Verify user owns this order
    // TODO: Update order in database with payment proof

    const updatedOrder = {
      id: orderId,
      paymentProof: paymentProof,
      transactionId: transactionId,
      status: 'under_review',
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Payment proof uploaded successfully'
    })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update order'
    }, { status: 500 })
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  if (orderDate.getTime() === today.getTime()) {
    return `Today ${timeString}`
  } else if (orderDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return `Yesterday ${timeString}`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

function getOrderTypeLabel(orderType: string): string {
  switch (orderType) {
    case 'BUY_UPI':
    case 'BUY_CDM':
      return 'Buy Order'
    case 'SELL':
      return 'Sell Order'
    default:
      return orderType
  }
}
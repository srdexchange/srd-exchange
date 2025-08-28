import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'completed', 'rejected'
    
    let whereClause: any = {}
    
    switch (status) {
      case 'pending':
        whereClause = {
          status: {
            in: ['PENDING', 'ADMIN_APPROVED', 'PAYMENT_SUBMITTED']
          }
        }
        break
      case 'completed':
        whereClause = { status: 'COMPLETED' }
        break
      case 'rejected':
        whereClause = { status: 'CANCELLED' }
        break
      default:
        // If no status specified, return all orders
        break
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            upiId: true,
            bankDetails: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform orders to match frontend expected format
    const transformedOrders = orders.map(order => ({
      id: `#${order.id.slice(-6)}`, // Show last 6 characters of order ID
      fullId: order.id,
      blockchainOrderId: order.blockchainOrderId,
      time: formatTime(order.createdAt),
      amount: Number(order.amount),
      type: getOrderTypeLabel(order.orderType),
      orderType: order.orderType,
      price: Number(order.buyRate || order.sellRate || 0),
      currency: order.orderType === 'BUY_CDM' ? 'CDM' : 'UPI',
      status: order.status,
      paymentProof: order.paymentProof,
      adminUpiId: order.adminUpiId,
      adminBankDetails: order.adminBankDetails,
      adminNotes: order.adminNotes,
      user: {
        id: order.user.id,
        walletAddress: order.user.walletAddress,
        upiId: order.user.upiId,
        bankDetails: order.user.bankDetails
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
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
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, adminNotes } = body

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and status are required'
      }, { status: 400 })
    }

    // TODO: Add admin authentication check here
    // const isAdmin = await verifyAdminToken(request)
    // if (!isAdmin) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Unauthorized'
    //   }, { status: 401 })
    // }

    // TODO: Update order in database
    const updatedOrder = {
      id: orderId,
      status: status,
      adminNotes: adminNotes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin' // TODO: Get actual admin ID
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Admin order update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update order'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    // TODO: Add admin authentication check
    // TODO: Delete/cancel order in database

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Admin order deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel order'
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
      return 'Buy Order'
    case 'BUY_CDM':
      return 'Buy Order'
    case 'SELL':
      return 'Sell Order'
    default:
      return orderType
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdminAccess(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck 
    }

    console.log('Admin orders API called by admin:', adminCheck.user.walletAddress);
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    console.log('Status filter:', status);
    
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
        break
    }

    console.log('Where clause:', whereClause);

    // 🔥 FIX: Use only select, not include + select together
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        blockchainOrderId: true,
        amount: true,
        usdtAmount: true,
        customAmount: true,
        orderType: true,
        status: true,
        paymentProof: true,
        adminUpiId: true,
        adminBankDetails: true,
        adminNotes: true,
        buyRate: true,
        sellRate: true,
        // 🔥 NEW: Include the user confirmation fields
        userConfirmedReceived: true,
        userConfirmedAt: true,
        isVerifiedOnChain: true,
        isCompletedOnChain: true,
        transactionHash: true,
        createdAt: true,
        updatedAt: true,
        // 🔥 FIX: Select user fields explicitly
        user: {
          select: {
            id: true,
            walletAddress: true,
            upiId: true,
            bankDetails: {
              select: {
                accountNumber: true,
                ifscCode: true,
                branchName: true,
                accountHolderName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found orders:', orders.length);
    console.log('Orders with user confirmation:', orders.map(o => ({
      id: o.id,
      orderType: o.orderType,
      userConfirmedReceived: o.userConfirmedReceived,
      userConfirmedAt: o.userConfirmedAt
    })));

    const transformedOrders = orders.map(order => ({
      id: `#${order.id.slice(-6)}`, 
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
      // 🔥 CRITICAL: Include the new database fields properly
      userConfirmedReceived: order.userConfirmedReceived || false,
      userConfirmedAt: order.userConfirmedAt ? order.userConfirmedAt.toISOString() : null,
      user: {
        id: order.user.id,
        walletAddress: order.user.walletAddress,
        upiId: order.user.upiId,
        bankDetails: order.user.bankDetails
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    console.log('Transformed orders with confirmations:', transformedOrders.map(o => ({
      id: o.id,
      fullId: o.fullId,
      orderType: o.orderType,
      userConfirmedReceived: o.userConfirmedReceived,
      userConfirmedAt: o.userConfirmedAt
    })));

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
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
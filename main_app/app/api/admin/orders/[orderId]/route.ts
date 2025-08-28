import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status, adminNotes, adminUpiId, adminBankDetails } = await request.json()
    
    const updatedOrder = await prisma.order.update({
      where: {
        id: params.orderId
      },
      data: {
        status,
        adminNotes,
        adminUpiId,
        adminBankDetails,
        updatedAt: new Date()
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

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
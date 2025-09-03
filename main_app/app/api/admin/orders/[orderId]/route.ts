import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    
    console.log('📝 Admin order update request:', {
      orderId,
      updateData: body
    })

    // 🔥 FIX: Handle custom amount properly
    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.adminUpiId !== undefined) updateData.adminUpiId = body.adminUpiId
    if (body.adminBankDetails !== undefined) updateData.adminBankDetails = body.adminBankDetails
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes
    
    // 🔥 CRITICAL: Handle custom amount conversion
    if (body.customAmount !== undefined) {
      const customAmountValue = parseFloat(body.customAmount.toString())
      if (!isNaN(customAmountValue) && customAmountValue > 0) {
        updateData.customAmount = customAmountValue
        console.log('💰 Setting custom amount:', customAmountValue)
      } else {
        console.warn('⚠️ Invalid custom amount received:', body.customAmount)
      }
    }

    console.log('📝 Final update data for database:', updateData)

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          include: {
            bankDetails: true
          }
        }
      }
    })

    console.log('✅ Order updated successfully with custom amount:', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      adminUpiId: updatedOrder.adminUpiId,
      customAmount: updatedOrder.customAmount, // 🔥 LOG: Custom amount
      originalAmount: updatedOrder.amount
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('❌ Admin order update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            bankDetails: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('❌ Get order error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch order' 
      },
      { status: 500 }
    )
  }
}
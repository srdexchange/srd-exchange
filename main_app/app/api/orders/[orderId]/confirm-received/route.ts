import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> } // 🔥 FIX: Make params a Promise
) {
  try {
    const { orderId } = await params; // 🔥 FIX: Await params before destructuring
    const { userConfirmedReceived, userConfirmedAt } = await request.json();

    console.log('📝 Updating order user confirmation:', {
      orderId,
      userConfirmedReceived,
      userConfirmedAt
    });

    // 🔥 ENHANCED: Better order finding with more robust matching
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { blockchainOrderId: orderId },
          { id: { endsWith: orderId } }, // For shortened IDs
        ]
      },
      select: {
        id: true,
        orderType: true,
        userConfirmedReceived: true,
        status: true
      }
    });

    if (!order) {
      console.error('❌ Order not found for ID:', orderId);
      
      // 🔥 DEBUG: Show available orders
      const recentOrders = await prisma.order.findMany({
        select: { 
          id: true, 
          blockchainOrderId: true, 
          orderType: true,
          userConfirmedReceived: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log('Recent orders for debugging:', recentOrders);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order not found',
          searchedId: orderId,
          recentOrders: recentOrders
        },
        { status: 404 }
      );
    }

    console.log('✅ Found order for update:', {
      foundOrderId: order.id,
      orderType: order.orderType,
      currentUserConfirmed: order.userConfirmedReceived
    });

    // Update the order with user confirmation
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        userConfirmedReceived: userConfirmedReceived,
        userConfirmedAt: userConfirmedAt ? new Date(userConfirmedAt) : new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userConfirmedReceived: true,
        userConfirmedAt: true,
        orderType: true
      }
    });

    console.log('✅ Order updated with user confirmation:', {
      orderId: updatedOrder.id,
      userConfirmedReceived: updatedOrder.userConfirmedReceived,
      userConfirmedAt: updatedOrder.userConfirmedAt,
      orderType: updatedOrder.orderType
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        userConfirmedReceived: updatedOrder.userConfirmedReceived,
        userConfirmedAt: updatedOrder.userConfirmedAt,
        orderType: updatedOrder.orderType
      },
      message: 'Order updated with user confirmation'
    });

  } catch (error) {
    console.error('❌ Error updating order confirmation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
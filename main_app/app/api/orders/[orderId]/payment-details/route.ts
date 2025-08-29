import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order with admin payment details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        adminUpiId: true,
        adminBankDetails: true,
        amount: true,
        status: true,
        orderType: true,
        updatedAt: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare payment details response
    const paymentDetails = {
      orderId: order.id,
      adminUpiId: order.adminUpiId,
      adminBankDetails: order.adminBankDetails ? JSON.parse(order.adminBankDetails) : null,
      customAmount: Number(order.amount),
      status: order.status,
      orderType: order.orderType,
      lastUpdated: order.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      paymentDetails
    });

  } catch (error) {
    console.error('Error fetching order payment details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
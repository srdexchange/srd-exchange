import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params; 

    console.log('🔍 Fetching payment details for order:', orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        adminUpiId: true,
        adminBankDetails: true,
        adminNotes: true,
        customAmount: true, 
        amount: true, 
        updatedAt: true
      }
    });

    if (!order) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }


    if (!order.adminUpiId && !order.adminBankDetails) {
      console.log('ℹ️ No payment details available yet for order:', orderId);
      return NextResponse.json({
        success: true,
        paymentDetails: null
      });
    }

    const paymentDetails = {
      adminUpiId: order.adminUpiId,
      adminBankDetails: order.adminBankDetails 
        ? (typeof order.adminBankDetails === 'string' 
            ? JSON.parse(order.adminBankDetails)
            : order.adminBankDetails)
        : null,
      customAmount: order.customAmount ? parseFloat(order.customAmount.toString()) : null, // 🔥 Parse custom amount properly
      originalAmount: order.amount ? parseFloat(order.amount.toString()) : null, // 🔥 Parse original amount
      status: order.status,
      adminNotes: order.adminNotes,
      lastUpdated: order.updatedAt
    };

    console.log('✅ Payment details found with custom amount:', {
      orderId,
      hasUpiId: !!paymentDetails.adminUpiId,
      hasBankDetails: !!paymentDetails.adminBankDetails,
      customAmount: paymentDetails.customAmount,
      originalAmount: paymentDetails.originalAmount
    });

    return NextResponse.json({
      success: true,
      paymentDetails
    });

  } catch (error) {
    console.error('❌ Payment details fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment details' 
      },
      { status: 500 }
    );
  }
}
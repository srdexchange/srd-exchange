import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection before queries
    await ensureConnection();

    const body = await request.json();
    const { walletAddress, accountNumber, ifscCode, branchName, accountHolderName } = body;

    console.log('📧 Received bank details save request:', {
      walletAddress,
      walletAddressLower: walletAddress?.toLowerCase(),
      accountNumber: accountNumber?.substring(0, 4) + '****', // Log partial for security
      ifscCode,
      branchName,
      accountHolderName
    });

    if (!walletAddress || !accountNumber || !ifscCode || !branchName || !accountHolderName) {
      return NextResponse.json(
        { success: false, error: 'All bank details are required' },
        { status: 400 }
      );
    }

    // Convert wallet address to lowercase for database query
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find the user by wallet address (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      include: { bankDetails: true }
    });

    if (!user) {
      console.error('❌ User not found for wallet address:', walletAddress);
      console.error('❌ Searched with normalized address:', normalizedWalletAddress);

      // Let's also try to find if user exists with different casing
      const userWithDifferentCasing = await prisma.user.findFirst({
        where: {
          walletAddress: {
            equals: walletAddress,
            mode: 'insensitive' // This makes the search case-insensitive
          }
        },
        include: { bankDetails: true }
      });

      if (userWithDifferentCasing) {
        console.log('✅ Found user with different casing:', userWithDifferentCasing.walletAddress);
        console.log('🔄 Will proceed with user ID:', userWithDifferentCasing.id);

        // Use the found user
        const bankDetails = await prisma.bankDetails.upsert({
          where: { userId: userWithDifferentCasing.id },
          update: {
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            branchName,
            accountHolderName,
            updatedAt: new Date()
          },
          create: {
            userId: userWithDifferentCasing.id,
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            branchName,
            accountHolderName
          }
        });

        console.log('💾 Bank details saved successfully with case-insensitive match:', {
          id: bankDetails.id,
          userId: bankDetails.userId,
          accountNumber: bankDetails.accountNumber.substring(0, 4) + '****'
        });

        return NextResponse.json({
          success: true,
          message: 'Bank details saved successfully',
          bankDetails: {
            id: bankDetails.id,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            branchName: bankDetails.branchName,
            accountHolderName: bankDetails.accountHolderName,
            createdAt: bankDetails.createdAt,
            updatedAt: bankDetails.updatedAt
          }
        });
      }

      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', { userId: user.id, hasBankDetails: !!user.bankDetails });

    // Create or update bank details
    const bankDetails = await prisma.bankDetails.upsert({
      where: { userId: user.id },
      update: {
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        branchName,
        accountHolderName,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        branchName,
        accountHolderName
      }
    });

    console.log('💾 Bank details saved successfully:', {
      id: bankDetails.id,
      userId: bankDetails.userId,
      accountNumber: bankDetails.accountNumber.substring(0, 4) + '****'
    });

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      bankDetails: {
        id: bankDetails.id,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        branchName: bankDetails.branchName,
        accountHolderName: bankDetails.accountHolderName,
        createdAt: bankDetails.createdAt,
        updatedAt: bankDetails.updatedAt
      }
    });

  } catch (error) {
    console.error('💥 Error saving bank details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save bank details. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection before queries
    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching bank details for wallet:', walletAddress);

    // Convert wallet address to lowercase for database query
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find the user and their bank details (case-insensitive)
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWalletAddress },
      include: { bankDetails: true }
    });

    // If not found with lowercase, try case-insensitive search
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          walletAddress: {
            equals: walletAddress,
            mode: 'insensitive'
          }
        },
        include: { bankDetails: true }
      });
    }

    if (!user) {
      console.log('ℹ️ No user found for wallet address:', walletAddress);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found, returning bank details:', !!user.bankDetails);

    return NextResponse.json({
      success: true,
      bankDetails: user.bankDetails
    });

  } catch (error) {
    console.error('💥 Error fetching bank details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
}
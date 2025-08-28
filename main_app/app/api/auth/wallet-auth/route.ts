import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, walletData, action } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    if (action === "login") {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress },
        include: { bankDetails: true }
      });

      if (!user) {
        return NextResponse.json({
          requiresRegistration: true,
          message: "User not found. Registration required."
        });
      }

      // Check if profile is complete (has UPI ID)
      const hasUpiId = user.upiId && user.upiId.trim() !== '';
      const isProfileComplete = user.profileCompleted && hasUpiId;

      // Update last login
      await prisma.user.update({
        where: { walletAddress: normalizedAddress },
        data: { lastLoginAt: new Date() }
      });

      return NextResponse.json({
        exists: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          upiId: user.upiId,
          profileCompleted: isProfileComplete,
          hasBankDetails: !!user.bankDetails,
        }
      });
    }

    if (action === "register") {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }

      // Create new user - profile is NOT complete yet (needs UPI ID)
      const newUser = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          profileCompleted: false, // Will be set to true when UPI ID is added
          lastLoginAt: new Date(),
        },
        include: { bankDetails: true }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          walletAddress: newUser.walletAddress,
          role: newUser.role,
          upiId: newUser.upiId,
          profileCompleted: false, // New users need to complete profile
          hasBankDetails: false,
        }
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
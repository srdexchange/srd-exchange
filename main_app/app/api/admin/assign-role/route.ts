import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    // Verify that the requester is an admin
    const authResult = await verifyAdminAccess(request)
    if (authResult instanceof NextResponse) {
        return authResult
    }

    try {
        const { walletAddress, role } = await request.json()

        // Validate input
        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        if (!role || !['USER', 'ADMIN'].includes(role)) {
            return NextResponse.json(
                { error: 'Valid role is required (USER or ADMIN)' },
                { status: 400 }
            )
        }

        const normalizedAddress = walletAddress.toLowerCase()

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: {
                walletAddress: normalizedAddress
            }
        })

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found. The wallet address must be registered first.' },
                { status: 404 }
            )
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: {
                walletAddress: normalizedAddress
            },
            data: {
                role: role,
                updatedAt: new Date()
            },
            select: {
                id: true,
                walletAddress: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        console.log(`Role updated for ${walletAddress}: ${existingUser.role} -> ${role}`)

        return NextResponse.json({
            success: true,
            message: `Successfully updated role to ${role}`,
            user: updatedUser,
            previousRole: existingUser.role
        })
    } catch (error) {
        console.error('Assign role error:', error)
        return NextResponse.json(
            { error: 'Failed to assign role' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const SECRET = process.env.ADMIN_SESSION_SECRET || 'srd-admin-secret-change-me'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

function signToken(address: string, timestamp: number): string {
  const hmac = createHmac('sha256', SECRET)
    .update(`${address.toLowerCase()}:${timestamp}`)
    .digest('hex')
  return `${address.toLowerCase()}:${timestamp}:${hmac}`
}

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json()

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the signature — confirms the caller owns this wallet
    const recovered = ethers.verifyMessage(message, signature)
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Check timestamp in message is recent (within 5 minutes) to prevent replay
    const tsMatch = message.match(/Timestamp: (\d+)/)
    if (!tsMatch) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }
    const msgTimestamp = parseInt(tsMatch[1])
    if (Date.now() - msgTimestamp > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Message expired. Please try again.' }, { status: 401 })
    }

    // Check DB for ADMIN role
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: 'Wallet not registered. Contact system administrator.' }, { status: 403 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied: This wallet does not have admin privileges.' }, { status: 403 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session token and set httpOnly cookie
    const token = signToken(address, msgTimestamp)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, walletAddress: user.walletAddress, role: user.role },
    })

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}

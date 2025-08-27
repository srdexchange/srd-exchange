import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const rates = await prisma.rate.findMany({
      where: {
        type: 'CURRENT'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // If no rates exist, create default rates
    if (rates.length === 0) {
      const defaultRates = await Promise.all([
        prisma.rate.create({
          data: {
            type: 'CURRENT',
            currency: 'UPI',
            buyRate: 85.6,
            sellRate: 85.6,
            updatedBy: 'system'
          }
        }),
        prisma.rate.create({
          data: {
            type: 'CURRENT',
            currency: 'CDM',
            buyRate: 85.6,
            sellRate: 85.6,
            updatedBy: 'system'
          }
        })
      ])
      
      return NextResponse.json({ rates: defaultRates })
    }

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    )
  }
}
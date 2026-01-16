
import { prisma } from './lib/prisma'
import { RateType, CurrencyType } from '@prisma/client'

async function main() {
    try {
        console.log('Connecting...')
        // Simulate admin update
        const currency = 'UPI'
        const buyRateNum = 89.5
        const sellRateNum = 88.5
        const adminAddress = '0x68921410bd83a958e45cf18e83faecfdfcb80c3a' // Lowercase admin address

        console.log('Upserting rate...')
        const updatedRate = await prisma.rate.upsert({
            where: {
                type_currency: {
                    type: RateType.CURRENT,
                    currency: currency as CurrencyType
                }
            },
            update: {
                buyRate: buyRateNum,
                sellRate: sellRateNum,
                updatedBy: adminAddress
            },
            create: {
                type: RateType.CURRENT,
                currency: currency as CurrencyType,
                buyRate: buyRateNum,
                sellRate: sellRateNum,
                updatedBy: adminAddress
            }
        })
        console.log('Success:', updatedRate)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        process.exit(0)
    }
}

main()

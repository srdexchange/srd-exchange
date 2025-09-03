import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with better connection handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Add connection retry logic
async function connectWithRetry(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected successfully')
      return
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error)
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${2000 * (i + 1)}ms...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      }
    }
  }
  console.error('❌ All database connection attempts failed')
}

// Auto-connect with retry
connectWithRetry()

// Enhanced database operation with retry
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      console.error(`Database operation attempt ${i + 1} failed:`, error)
      
      // Check if it's a connection error
      if (error.code === 'P1001' || error.message?.includes("Can't reach database")) {
        if (i < retries - 1) {
          console.log(`⏳ Retrying database operation in 3s...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
          continue
        }
      }
      throw error
    }
  }
  throw new Error('Database operation failed after all retries')
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
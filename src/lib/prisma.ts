import { PrismaClient } from '@prisma/client'

if (typeof window === 'undefined') {
  try {
    // Force IPv4 address resolution first in Node.js server environments to prevent dual-stack Neon connection delays
    const dns = require('node:dns')
    if (dns?.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first')
    }
  } catch {}
}

const poolerUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: poolerUrl
      ? {
          db: {
            url: poolerUrl,
          },
        }
      : undefined,
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

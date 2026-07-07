import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  
  // Mock client for build time (avoiding the constructor error)
  return {
    user: {
      findUnique: () => Promise.reject(new Error('DATABASE_URL not configured')),
      create: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    portfolio: {
      findFirst: () => Promise.reject(new Error('DATABASE_URL not configured')),
      create: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    holding: {
      findFirst: () => Promise.reject(new Error('DATABASE_URL not configured')),
      create: () => Promise.reject(new Error('DATABASE_URL not configured')),
      update: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    transaction: {
      create: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    schemeMaster: {
      findUnique: () => Promise.reject(new Error('DATABASE_URL not configured')),
      upsert: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    topFundsCache: {
      findMany: () => Promise.reject(new Error('DATABASE_URL not configured')),
      create: () => Promise.reject(new Error('DATABASE_URL not configured')),
      deleteMany: () => Promise.reject(new Error('DATABASE_URL not configured')),
    },
    $transaction: async (fn: any) => {
      throw new Error('DATABASE_URL not configured');
    },
  } as any;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

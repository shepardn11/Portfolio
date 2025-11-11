const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client to avoid connection issues in serverless (Vercel)
// This prevents "prepared statement already exists" errors
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const prisma = global.prisma;

module.exports = prisma;

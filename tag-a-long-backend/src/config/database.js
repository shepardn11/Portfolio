const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client to avoid connection issues in serverless (Vercel)
// This prevents "prepared statement already exists" errors
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Ensure connections are closed on hot reload in development
  if (process.env.NODE_ENV !== 'production') {
    const cleanup = async () => {
      await global.prisma.$disconnect();
    };
    process.on('beforeExit', cleanup);
  }
}

const prisma = global.prisma;

module.exports = prisma;

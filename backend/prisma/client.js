const { PrismaClient } = require('@prisma/client');

// Create a singleton instance of the Prisma client
const prisma = new PrismaClient();

// Handle connection errors
prisma.$on('error', (e) => {
  console.error('Prisma Client Error:', e);
});

// Add shutdown handling on the process object instead
process.on('beforeExit', () => {
  console.log('Prisma Client is shutting down');
});

module.exports = prisma;
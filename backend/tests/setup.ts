import { PrismaClient } from '@prisma/client';

const userPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.USER_DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
});

const adminPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'file:./prisma/admin.db',
    },
  },
});

beforeAll(async () => {
  console.log('Setting up test environment...');
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  await userPrisma.$disconnect();
  await adminPrisma.$disconnect();
});

export { userPrisma, adminPrisma };

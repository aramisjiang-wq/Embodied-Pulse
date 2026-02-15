const { PrismaClient: AdminPrismaClient } = require('./node_modules/.prisma/client-admin');
const bcrypt = require('bcryptjs');

const adminPrisma = new AdminPrismaClient({
  datasources: {
    db: {
      url: 'file:/Users/dong/Documents/Product/Embodied/backend/prisma/admin.db'
    }
  }
});

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    console.log('Prisma client initialized');

    const adminId = '188aa223-6c41-4a9d-bb61-b8d9a6413523';
    const username = 'ash';
    const email = 'admin@embodiedpulse.com';
    const password = 'admin123';
    const adminNumber = 'ADMIN001';

    const passwordHash = await bcrypt.hash(password, 10);

    console.log('Attempting to create admin...');
    const admin = await adminPrisma.$transaction(async (tx) => {
      return await tx.admins.create({
        data: {
          id: adminId,
          username: username,
          email: email,
          password_hash: passwordHash,
          role: 'super_admin',
          is_active: true,
          admin_number: adminNumber,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    });

    console.log('Admin created successfully:', admin.username);
    console.log('Login credentials:');
    console.log('  Username:', username);
    console.log('  Password:', password);
    console.log('  Email:', email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin already exists');
    } else {
      console.error('Error creating admin:', error);
    }
  } finally {
    await adminPrisma.$disconnect();
  }
}

createAdminAccount();
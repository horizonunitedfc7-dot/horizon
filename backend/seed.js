const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('horizonadmin123', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@horizonunited.com' },
    update: {},
    create: {
      email: 'admin@horizonunited.com',
      password,
      name: 'Super Admin',
      role: 'ADMIN'
    }
  });
  console.log('Admin user created/verified');
}

main().catch(console.error).finally(() => prisma.$disconnect());

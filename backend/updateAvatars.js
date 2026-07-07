const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.updateMany({
    where: { email: 'academic@example.com' },
    data: {
      passportPhoto: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=400&auto=format&fit=crop'
    }
  });

  await prisma.applicant.updateMany({
    where: { email: 'scholarship@example.com' },
    data: {
      passportPhoto: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=400&auto=format&fit=crop'
    }
  });

  console.log('Avatars updated for both seeded players!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

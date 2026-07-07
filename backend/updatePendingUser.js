const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.update({
    where: { regno: 'HZN-PNDING' },
    data: {
      passportPhoto: '/uploads/passports/dummy-passport.jpg', // dummy passport
      paymentStatus: 'COMPLETED',
      paymentRef: 'FLW-MOCK-123456789',
    }
  });

  console.log('Updated Peter Pending with a profile picture and completed payment status.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

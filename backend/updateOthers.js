const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.updateMany({
    where: {
      email: {
        in: ['samuel.smith@example.com', 'john.doe@example.com'] // Based on previous seeded emails
      }
    },
    data: {
      paymentStatus: 'COMPLETED',
      paymentRef: 'FLW-MOCK-987654321',
    }
  });

  console.log('Updated Samuel and John with completed payment status.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

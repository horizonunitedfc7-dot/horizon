const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.updateMany({
    data: {
      paymentStatus: 'COMPLETED'
    }
  });
  console.log('Payment status updated to COMPLETED for all applicants');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

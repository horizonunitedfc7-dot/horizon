const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.updateMany({
    data: {
      parentConsent: true,
      releasedFromClub: true
    }
  });
  console.log('Parent consent and club release updated to true for all applicants');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

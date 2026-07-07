const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.applicant.updateMany({
    data: {
      consentLetter: '/uploads/passports/dummy-consent.pdf',
    }
  });

  await prisma.applicant.updateMany({
    where: { playerType: 'SCHOLARSHIP' },
    data: {
      clubReleaseLetter: '/uploads/passports/dummy-release.pdf',
    }
  });
  console.log('Dummy letters seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

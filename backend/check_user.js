const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const applicants = await prisma.applicant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(applicants);
}

main().catch(console.error).finally(() => prisma.$disconnect());

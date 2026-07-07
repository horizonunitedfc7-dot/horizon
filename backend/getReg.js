const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const players = await prisma.applicant.findMany({
    where: { 
      // exclude Samuel Smith to only get the newly seeded players
      firstname: { not: "Samuel" }
    },
    select: { firstname: true, lastname: true, regno: true }
  });
  console.log(JSON.stringify(players, null, 2));
}

main().finally(() => prisma.$disconnect());

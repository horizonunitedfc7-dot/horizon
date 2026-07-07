const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding one more event...");

  const newEvent = {
    title: "NLO Matchday 1: Season Opener",
    description: "The opening match of the Nationwide League One season. Horizon United FC takes on the defending champions in a massive clash at the Horizon Stadium.",
    location: "Horizon Stadium",
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 58 * 60 * 1000), // ~25 days, 12 hours from now
    teamA: "Horizon United",
    teamB: "Sporting Lagos",
    isPoster: true,
    image: "https://images.unsplash.com/photo-1518605368461-1ee5582f3c7e?auto=format&fit=crop&q=80&w=2000",
    ticketLink: "https://tix.africa"
  };

  await prisma.event.create({ data: newEvent });
  console.log("Seeded new event successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  // 1. Seed private schedule for Samuel Smith
  const samuel = await prisma.applicant.findFirst({
    where: {
      firstname: { contains: "Samuel" },
      lastname: { contains: "Smith" }
    }
  });

  if (samuel) {
    const schedule = [
      {
        title: "Tactical Meeting & Video Analysis",
        date: "Tomorrow, 08:30 AM",
        location: "Main Auditorium",
        type: "MANDATORY"
      },
      {
        title: "High-Intensity Recovery",
        date: "Tomorrow, 10:00 AM",
        location: "Pitch A",
        type: "MANDATORY"
      },
      {
        title: "Optional Gym Conditioning",
        date: "Tomorrow, 14:00 PM",
        location: "Fitness Center",
        type: "OPTIONAL"
      },
      {
        title: "Matchday: Away vs Sporting Lagos",
        date: "Saturday, 15:00 PM",
        location: "Mobolaji Johnson Arena",
        type: "SELECTED SQUAD"
      }
    ];

    await prisma.applicant.update({
      where: { id: samuel.id },
      data: { privateSchedule: JSON.stringify(schedule) }
    });
    console.log("Seeded private schedule for Samuel Smith.");
  } else {
    console.log("Could not find Samuel Smith in the database.");
  }

  // 2. Seed public events
  const events = [
    {
      title: "Pre-Season Friendly",
      description: "Come watch Horizon United's official squad take on local rivals in a thrilling pre-season encounter.",
      location: "Horizon Stadium",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      teamA: "Horizon United",
      teamB: "Lagos City FC",
      isPoster: true,
      ticketLink: "https://tix.africa"
    },
    {
      title: "Open Trial Day",
      description: "The next batch of open trial assessments for aspiring players.",
      location: "Horizon Training Pitch",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      teamA: "",
      teamB: "",
      isPoster: false
    },
    {
      title: "Academy Cup Final",
      description: "Our U-19s are in the cup final! Show your support.",
      location: "National Stadium Surulere",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      teamA: "Horizon Academy",
      teamB: "Enyimba Youth",
      isPoster: true,
      ticketLink: "https://tix.africa"
    }
  ];

  for (const ev of events) {
    await prisma.event.create({ data: ev });
  }
  console.log("Seeded public events.");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

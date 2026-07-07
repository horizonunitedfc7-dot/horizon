const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log("Cleaning up old test data...");
  await prisma.applicant.deleteMany({
    where: {
      firstname: { startsWith: "Test" }
    }
  });

  console.log("Seeding realistic applicants...");

  const generateApplicant = (type, index, firstname, lastname, imgId) => {
    return {
      firstname,
      lastname,
      regno: `HZN26${type.substring(0,3).toUpperCase()}${index}X${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      age: 18 + (index % 4),
      nationality: "Nigerian",
      state: "Lagos",
      address: "Victoria Island, Lagos",
      mobile: `0800000000${index}`,
      email: `${firstname.toLowerCase()}.${lastname.toLowerCase()}@example.com`,
      gender: "Male",
      position: ["Forward", "Midfielder", "Defender", "Goalkeeper"][index % 4],
      foot: index % 2 === 0 ? "Right" : "Left",
      height: ["175cm", "180cm", "185cm", "190cm"][index % 4],
      weight: ["70kg", "75kg", "80kg", "85kg"][index % 4],
      experience: (index % 4) + 1,
      bloodgroup: "O+",
      genotype: "AA",
      emergencynumber: "08011111111",
      institute: "St. Finbarr's College",
      classlevel: "SS3",
      guardianname: "Mr. " + lastname,
      relationship: "Father",
      guardianmobile: "08022222222",
      guardianaddress: "Victoria Island, Lagos",
      playerType: type, // "ACADEMIC" or "SCHOLARSHIP"
      applicationStatus: "PENDING",
      paymentStatus: "COMPLETED",
      password: "password123", // Raw password
      passportPhoto: `https://i.pravatar.cc/300?img=${imgId}`
    };
  };

  const academicNames = [
    ["Ade", "Balogun", 11],
    ["Chinedu", "Okafor", 12],
    ["Emmanuel", "Eze", 13],
    ["David", "Nwankwo", 14]
  ];

  const scholarshipNames = [
    ["Victor", "Osimhen", 15],
    ["Kelechi", "Iheanacho", 16],
    ["Wilfred", "Ndidi", 17],
    ["Alex", "Iwobi", 18]
  ];

  // 4 Academic
  for (let i = 0; i < 4; i++) {
    await prisma.applicant.create({ data: generateApplicant('ACADEMIC', i + 1, academicNames[i][0], academicNames[i][1], academicNames[i][2]) });
  }

  // 4 Scholarship
  for (let i = 0; i < 4; i++) {
    await prisma.applicant.create({ data: generateApplicant('SCHOLARSHIP', i + 1, scholarshipNames[i][0], scholarshipNames[i][1], scholarshipNames[i][2]) });
  }

  console.log("Seeded 8 pending applicants with COMPLETED payment.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

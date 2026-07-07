const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.applicant.create({
    data: {
      firstname: 'Peter',
      lastname: 'Pending',
      email: 'peter.pending@example.com',
      password: hashedPassword,
      mobile: '+2348000000002',
      age: 18,
      gender: 'Male',
      nationality: 'Nigeria',
      state: 'Lagos',
      address: '45 Pending Road',
      position: 'Forward',
      height: '185cm',
      weight: '78kg',
      foot: 'Right',
      experience: 2,
      bloodgroup: 'O+',
      genotype: 'AA',
      emergencynumber: '+2348000000003',
      institute: 'Local High School',
      classlevel: 'SS3',
      guardianname: 'Mr. Pending',
      relationship: 'Father',
      guardianmobile: '+2348000000004',
      guardianaddress: '45 Pending Road',
      hasHealthIssues: false,
      parentConsent: true,
      releasedFromClub: true,
      playerType: 'SCHOLARSHIP',
      applicationStatus: 'PENDING',
      regno: 'HZN-PNDING',
      consentLetter: '/uploads/passports/dummy-consent.pdf',
      clubReleaseLetter: '/uploads/passports/dummy-release.pdf',
      feeLedger: JSON.stringify({ school: false, jersey: false, accommodation: false, feeding: false })
    }
  });

  console.log('Seeded pending user: peter.pending@example.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

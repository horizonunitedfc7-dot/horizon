const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('player123', 10);

  // Seed Academic Player
  const academicPlayer = await prisma.applicant.upsert({
    where: { email: 'academic@example.com' },
    update: {},
    create: {
      firstname: 'John',
      lastname: 'Doe',
      regno: 'HZN-ACAD01',
      age: 18,
      nationality: 'Nigerian',
      state: 'Lagos',
      address: '123 Academic St',
      mobile: '08012345678',
      email: 'academic@example.com',
      gender: 'Male',
      position: 'Midfielder',
      foot: 'Right',
      height: '175cm',
      weight: '70kg',
      experience: 2,
      bloodgroup: 'O+',
      genotype: 'AA',
      emergencynumber: '08087654321',
      institute: 'University of Lagos',
      classlevel: '100 Level',
      guardianname: 'Jane Doe',
      relationship: 'Mother',
      guardianmobile: '08087654321',
      guardianaddress: '123 Academic St',
      playerType: 'ACADEMIC',
      password: password,
      applicationStatus: 'APPROVED'
    }
  });

  // Seed Scholarship Player
  const scholarshipPlayer = await prisma.applicant.upsert({
    where: { email: 'scholarship@example.com' },
    update: {},
    create: {
      firstname: 'Samuel',
      lastname: 'Smith',
      regno: 'HZN-SCH01',
      age: 19,
      nationality: 'Nigerian',
      state: 'Rivers',
      address: '456 Scholar Ave',
      mobile: '09012345678',
      email: 'scholarship@example.com',
      gender: 'Male',
      position: 'Forward',
      foot: 'Left',
      height: '180cm',
      weight: '75kg',
      experience: 4,
      bloodgroup: 'B+',
      genotype: 'AS',
      emergencynumber: '09087654321',
      institute: 'High School',
      classlevel: 'SS3',
      guardianname: 'Peter Smith',
      relationship: 'Father',
      guardianmobile: '09087654321',
      guardianaddress: '456 Scholar Ave',
      playerType: 'SCHOLARSHIP',
      password: password,
      applicationStatus: 'APPROVED'
    }
  });

  console.log('Seeded Academic Player: HZN-ACAD01 (Password: player123)');
  console.log('Seeded Scholarship Player: HZN-SCH01 (Password: player123)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

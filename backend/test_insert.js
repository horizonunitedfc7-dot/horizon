const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const data = {
      firstname: "Test",
      lastname: "User",
      age: "25",
      nationality: "Nigeria",
      state: "Lagos",
      address: "123 Test St",
      mobile: "+2348106131520",
      email: "test@example.com",
      gender: "Male",
      position: "Forward",
      foot: "Right",
      height: "180cm",
      weight: "75kg",
      experience: "5",
      bloodgroup: "O+",
      genotype: "AA",
      emergencynumber: "08000000000",
      institute: "Test High",
      classlevel: "SS3",
      guardianname: "John Doe",
      relationship: "Father",
      guardianmobile: "08000000001",
      guardianaddress: "123 Test St",
      playerType: "SCHOLARSHIP",
      rules: 'on',
      discipline: 'on'
    };

    const regno = "TEST-1234";

    const applicant = await prisma.applicant.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        regno: regno,
        age: parseInt(data.age),
        nationality: data.nationality,
        state: data.state,
        address: data.address,
        mobile: data.mobile,
        email: data.email,
        gender: data.gender,
        message: data.message,

        position: data.position,
        foot: data.foot,
        height: data.height,
        weight: data.weight,
        prevclub: data.prevclub,
        experience: parseInt(data.experience),
        achievement: data.achievement,

        bloodgroup: data.bloodgroup,
        genotype: data.genotype,
        medicalcondition: data.medicalcondition,
        allergy: data.allergy,
        emergencynumber: data.emergencynumber,

        institute: data.institute,
        classlevel: data.classlevel,

        guardianname: data.guardianname,
        relationship: data.relationship,
        guardianmobile: data.guardianmobile,
        guardianaddress: data.guardianaddress,
        
        rulesAgreed: data.rules === 'on' || data.rules === true,
        disciplineAgreed: data.discipline === 'on' || data.discipline === true,

        playerType: data.playerType || 'ACADEMIC',
        password: null,
        passportPhoto: null,
        consentLetter: null,
        clubReleaseLetter: null,
        registrationReceipt: null,
        releasedFromClub: false,
        hasHealthIssues: false,
        parentConsent: false,
        feeLedger: null,
        
        paymentStatus: 'PENDING',
        paymentRef: null
      }
    });
    console.log("Success", applicant.id);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();

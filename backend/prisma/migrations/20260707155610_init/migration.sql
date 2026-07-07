-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "regno" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "nationality" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "message" TEXT,
    "position" TEXT NOT NULL,
    "foot" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "prevclub" TEXT,
    "experience" INTEGER NOT NULL,
    "achievement" TEXT,
    "bloodgroup" TEXT NOT NULL,
    "genotype" TEXT NOT NULL,
    "medicalcondition" TEXT,
    "allergy" TEXT,
    "emergencynumber" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "classlevel" TEXT NOT NULL,
    "guardianname" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "guardianmobile" TEXT NOT NULL,
    "guardianaddress" TEXT NOT NULL,
    "rulesAgreed" BOOLEAN NOT NULL DEFAULT true,
    "disciplineAgreed" BOOLEAN NOT NULL DEFAULT true,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentRef" TEXT,
    "applicationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "playerType" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "password" TEXT,
    "passportPhoto" TEXT,
    "releasedFromClub" BOOLEAN NOT NULL DEFAULT false,
    "hasHealthIssues" BOOLEAN NOT NULL DEFAULT false,
    "parentConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentLetter" TEXT,
    "clubReleaseLetter" TEXT,
    "feeLedger" TEXT,
    "scoutRatings" TEXT,
    "privateSchedule" TEXT,
    "coachNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentViaWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "teamA" TEXT,
    "teamB" TEXT,
    "isPoster" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "ticketLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_regno_key" ON "Applicant"("regno");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_key_key" ON "Fee"("key");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

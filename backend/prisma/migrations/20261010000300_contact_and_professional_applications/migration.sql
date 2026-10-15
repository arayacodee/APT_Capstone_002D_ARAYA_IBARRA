ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "pendingVerificationSid" TEXT,
  ADD COLUMN "phoneVerificationSentAt" TIMESTAMP(3);
CREATE TABLE "ProfessionalApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "category" "BusinessCategory" NOT NULL DEFAULT 'GENERAL',
  "description" TEXT,
  "monthlyPrice" INTEGER NOT NULL DEFAULT 7900,
  "currency" TEXT NOT NULL DEFAULT 'CLP',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfessionalApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProfessionalApplication_userId_key" ON "ProfessionalApplication"("userId");
ALTER TABLE "ProfessionalApplication" ADD CONSTRAINT "ProfessionalApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

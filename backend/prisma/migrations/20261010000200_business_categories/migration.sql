CREATE TYPE "BusinessCategory" AS ENUM ('GENERAL', 'WELLNESS', 'BEAUTY');
CREATE TYPE "AttentionMode" AS ENUM ('ONSITE', 'ONLINE', 'BOTH');
ALTER TABLE "Business"
  ADD COLUMN "category" "BusinessCategory" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "professionalName" TEXT,
  ADD COLUMN "specialties" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "attentionMode" "AttentionMode";

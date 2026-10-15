CREATE TABLE "BusinessPhoto" (
 "id" TEXT NOT NULL,
 "businessId" TEXT NOT NULL,
 "imageUrl" TEXT NOT NULL,
 "imagePublicId" TEXT NOT NULL,
 "caption" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "BusinessPhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BusinessPhoto_businessId_createdAt_idx" ON "BusinessPhoto"("businessId", "createdAt");
ALTER TABLE "BusinessPhoto" ADD CONSTRAINT "BusinessPhoto_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

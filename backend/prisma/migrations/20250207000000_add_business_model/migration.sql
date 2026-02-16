-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "natureOfBusiness" TEXT,
    "pan" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "address" TEXT,
    "contactMobile" TEXT NOT NULL,
    "contactEmail" TEXT,
    "signatoryName" TEXT NOT NULL,
    "signatoryMobile" TEXT NOT NULL,
    "panCardUrl" TEXT,
    "gstCertificateUrl" TEXT,
    "businessLicenseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "turnover" DECIMAL(15,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_gstin_key" ON "Business"("gstin");

-- CreateIndex
CREATE INDEX "Business_userId_idx" ON "Business"("userId");

-- CreateIndex
CREATE INDEX "Business_gstin_idx" ON "Business"("gstin");

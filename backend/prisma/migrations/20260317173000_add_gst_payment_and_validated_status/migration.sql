-- Add 'validated' to GST filing status enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GstFilingStatus') THEN
    ALTER TYPE "GstFilingStatus" ADD VALUE IF NOT EXISTS 'validated';
  END IF;
END $$;

-- Payment status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GstPaymentStatus') THEN
    CREATE TYPE "GstPaymentStatus" AS ENUM ('pending', 'paid', 'failed');
  END IF;
END $$;

-- GST payment records
CREATE TABLE IF NOT EXISTS "public"."GSTPayment" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "filingId" INTEGER NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "status" "GstPaymentStatus" NOT NULL DEFAULT 'pending',
  "paymentDate" TIMESTAMP(3),
  "reference" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GSTPayment_userId_filingId_idx"
ON "public"."GSTPayment"("userId", "filingId");

CREATE INDEX IF NOT EXISTS "GSTPayment_status_idx"
ON "public"."GSTPayment"("status");

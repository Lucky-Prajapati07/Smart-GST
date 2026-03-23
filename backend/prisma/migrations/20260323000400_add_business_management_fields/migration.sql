DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ManagedBusinessStatus') THEN
    CREATE TYPE "ManagedBusinessStatus" AS ENUM ('Pending', 'Verified', 'Flagged', 'Rejected', 'Inactive');
  END IF;
END $$;

ALTER TABLE "Business"
ADD COLUMN IF NOT EXISTS "managementStatus" "ManagedBusinessStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Business_managementStatus_idx" ON "Business"("managementStatus");
CREATE INDEX IF NOT EXISTS "Business_deletedAt_idx" ON "Business"("deletedAt");

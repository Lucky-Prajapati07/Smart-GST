DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ManagedDocumentStatus') THEN
    CREATE TYPE "ManagedDocumentStatus" AS ENUM ('Pending', 'Verified', 'Flagged');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ManagedDocument" (
  "id" SERIAL PRIMARY KEY,
  "docKey" TEXT NOT NULL UNIQUE,
  "userId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "fileName" TEXT,
  "documentType" TEXT,
  "category" TEXT,
  "status" "ManagedDocumentStatus" NOT NULL DEFAULT 'Pending',
  "notes" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ManagedDocument_userId_idx" ON "ManagedDocument"("userId");
CREATE INDEX IF NOT EXISTS "ManagedDocument_status_idx" ON "ManagedDocument"("status");
CREATE INDEX IF NOT EXISTS "ManagedDocument_sourceType_idx" ON "ManagedDocument"("sourceType");

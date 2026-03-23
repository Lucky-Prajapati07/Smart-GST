DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReminderStatus') THEN
    CREATE TYPE "ReminderStatus" AS ENUM ('Pending', 'Sent', 'Cancelled', 'Failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'Pending',
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Reminder_userId_status_idx" ON "Reminder"("userId", "status");
CREATE INDEX IF NOT EXISTS "Reminder_scheduledFor_idx" ON "Reminder"("scheduledFor");

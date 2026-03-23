DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminNotificationStatus') THEN
    CREATE TYPE "AdminNotificationStatus" AS ENUM ('Draft', 'Sent', 'Failed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserNotificationStatus') THEN
    CREATE TYPE "UserNotificationStatus" AS ENUM ('Delivered', 'Read', 'Clicked');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminNotification" (
  "id" SERIAL PRIMARY KEY,
  "notificationKey" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "targetGroup" TEXT NOT NULL,
  "deliveryTypes" JSONB NOT NULL,
  "status" "AdminNotificationStatus" NOT NULL DEFAULT 'Sent',
  "createdBy" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserNotification" (
  "id" SERIAL PRIMARY KEY,
  "adminNotificationId" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "UserNotificationStatus" NOT NULL DEFAULT 'Delivered',
  "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserNotification_adminNotificationId_fkey"
    FOREIGN KEY ("adminNotificationId") REFERENCES "AdminNotification"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserNotification_adminNotificationId_userId_key"
  ON "UserNotification"("adminNotificationId", "userId");
CREATE INDEX IF NOT EXISTS "AdminNotification_status_idx" ON "AdminNotification"("status");
CREATE INDEX IF NOT EXISTS "AdminNotification_targetGroup_idx" ON "AdminNotification"("targetGroup");
CREATE INDEX IF NOT EXISTS "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");
CREATE INDEX IF NOT EXISTS "UserNotification_userId_status_idx" ON "UserNotification"("userId", "status");
CREATE INDEX IF NOT EXISTS "UserNotification_adminNotificationId_idx" ON "UserNotification"("adminNotificationId");

-- Create enums for admin-managed users
CREATE TYPE "ManagedUserStatus" AS ENUM ('Active', 'Inactive', 'Pending');
CREATE TYPE "ManagedUserPlan" AS ENUM ('Basic', 'Pro', 'Enterprise');

-- Create table for admin user management metadata
CREATE TABLE "UserManagement" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "status" "ManagedUserStatus" NOT NULL DEFAULT 'Pending',
    "plan" "ManagedUserPlan" NOT NULL DEFAULT 'Basic',
    "lastLoginAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserManagement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserManagement_userId_key" ON "UserManagement"("userId");
CREATE INDEX "UserManagement_email_idx" ON "UserManagement"("email");
CREATE INDEX "UserManagement_status_idx" ON "UserManagement"("status");
CREATE INDEX "UserManagement_plan_idx" ON "UserManagement"("plan");
CREATE INDEX "UserManagement_deletedAt_idx" ON "UserManagement"("deletedAt");

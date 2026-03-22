-- Ensure termsConditions exists for all environments (safe for already-updated DBs)
ALTER TABLE "public"."Settings"
ADD COLUMN IF NOT EXISTS "termsConditions" TEXT;

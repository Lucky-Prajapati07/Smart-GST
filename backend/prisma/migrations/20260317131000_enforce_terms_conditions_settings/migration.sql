-- Ensure termsConditions is always present and durable
ALTER TABLE "public"."Settings"
ADD COLUMN IF NOT EXISTS "termsConditions" TEXT;

UPDATE "public"."Settings"
SET "termsConditions" = '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. may be charged on delayed payment.\n3. Subject to local jurisdiction only.'
WHERE "termsConditions" IS NULL OR btrim("termsConditions") = '';

ALTER TABLE "public"."Settings"
ALTER COLUMN "termsConditions" SET DEFAULT '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. may be charged on delayed payment.\n3. Subject to local jurisdiction only.';

ALTER TABLE "public"."Settings"
ALTER COLUMN "termsConditions" SET NOT NULL;

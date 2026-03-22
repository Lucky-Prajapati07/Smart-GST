-- Normalize and harden GST filing schema

-- 1) Remove duplicates that would collide after filingType normalization.
WITH normalized AS (
  SELECT
    id,
    "userId",
    "filingPeriod",
    CASE
      WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR1' THEN 'GSTR1'
      WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR3B' THEN 'GSTR3B'
      WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR9' THEN 'GSTR9'
      ELSE 'GSTR3B'
    END AS normalized_type,
    ROW_NUMBER() OVER (
      PARTITION BY
        "userId",
        "filingPeriod",
        CASE
          WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR1' THEN 'GSTR1'
          WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR3B' THEN 'GSTR3B'
          WHEN UPPER(REPLACE(COALESCE("filingType", ''), '-', '')) = 'GSTR9' THEN 'GSTR9'
          ELSE 'GSTR3B'
        END
      ORDER BY "updatedAt" DESC, id DESC
    ) AS rn
  FROM "public"."GSTFiling"
), to_delete AS (
  SELECT id FROM normalized WHERE rn > 1
)
DELETE FROM "public"."GSTFiling" g
USING to_delete d
WHERE g.id = d.id;

-- 2) Create enum types if they do not already exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GstFilingType') THEN
    CREATE TYPE "GstFilingType" AS ENUM ('GSTR1', 'GSTR3B', 'GSTR9');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GstFilingStatus') THEN
    CREATE TYPE "GstFilingStatus" AS ENUM ('draft', 'calculated', 'filed', 'submitted');
  END IF;
END $$;

-- 3) Convert filingType and status to enums with safe mappings.
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT c.udt_name
  INTO current_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'GSTFiling'
    AND c.column_name = 'filingType';

  IF current_type IS DISTINCT FROM 'GstFilingType' THEN
    EXECUTE '
      ALTER TABLE "public"."GSTFiling"
      ALTER COLUMN "filingType" TYPE "GstFilingType"
      USING (
        CASE
          WHEN UPPER(REPLACE(COALESCE("filingType", ''''), ''-'', '''')) = ''GSTR1'' THEN ''GSTR1''::"GstFilingType"
          WHEN UPPER(REPLACE(COALESCE("filingType", ''''), ''-'', '''')) = ''GSTR3B'' THEN ''GSTR3B''::"GstFilingType"
          WHEN UPPER(REPLACE(COALESCE("filingType", ''''), ''-'', '''')) = ''GSTR9'' THEN ''GSTR9''::"GstFilingType"
          ELSE ''GSTR3B''::"GstFilingType"
        END
      )
    ';
  END IF;
END $$;

DO $$
DECLARE
  current_type text;
BEGIN
  SELECT c.udt_name
  INTO current_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'GSTFiling'
    AND c.column_name = 'status';

  IF current_type IS DISTINCT FROM 'GstFilingStatus' THEN
    EXECUTE 'ALTER TABLE "public"."GSTFiling" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE '
      ALTER TABLE "public"."GSTFiling"
      ALTER COLUMN "status" TYPE "GstFilingStatus"
      USING (
        CASE LOWER(COALESCE("status", ''draft''))
          WHEN ''draft'' THEN ''draft''::"GstFilingStatus"
          WHEN ''calculated'' THEN ''calculated''::"GstFilingStatus"
          WHEN ''filed'' THEN ''filed''::"GstFilingStatus"
          WHEN ''submitted'' THEN ''submitted''::"GstFilingStatus"
          ELSE ''draft''::"GstFilingStatus"
        END
      )
    ';
  END IF;
END $$;

ALTER TABLE "public"."GSTFiling"
ALTER COLUMN "status" SET DEFAULT 'draft'::"GstFilingStatus";

-- 4) Add useful indexes for GST calculations and listing.
CREATE INDEX IF NOT EXISTS "Invoices_userId_invoiceDate_idx"
ON "public"."Invoices"("userId", "invoiceDate");

CREATE INDEX IF NOT EXISTS "Expenses_userId_date_idx"
ON "public"."Expenses"("userId", "date");

CREATE INDEX IF NOT EXISTS "GSTFiling_userId_status_idx"
ON "public"."GSTFiling"("userId", "status");

CREATE INDEX IF NOT EXISTS "GSTFiling_userId_dueDate_idx"
ON "public"."GSTFiling"("userId", "dueDate");

-- AlterTable
ALTER TABLE "public"."Expenses" ALTER COLUMN "itc" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

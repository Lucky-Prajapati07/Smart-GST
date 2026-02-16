-- CreateTable
CREATE TABLE "public"."Invoices" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "partyGstin" TEXT NOT NULL,
    "amount" TEXT,
    "ewayBillNumber" TEXT,
    "transportMode" TEXT,
    "notes" TEXT,
    "gst" TEXT,
    "totalAmount" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoices_invoiceNumber_key" ON "public"."Invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoices_partyGstin_key" ON "public"."Invoices"("partyGstin");

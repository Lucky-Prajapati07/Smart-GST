-- CreateTable
CREATE TABLE IF NOT EXISTS "InvoiceOcrDocument" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "ocrEngine" TEXT NOT NULL,
    "rawText" TEXT,
    "extractedData" JSONB,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Processed',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceOcrDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InvoiceOcrDocument_userId_createdAt_idx" ON "InvoiceOcrDocument"("userId", "createdAt");

-- CreateTable
CREATE TABLE "public"."Clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "creditLimit" INTEGER,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "creditLimit" INTEGER,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clients_gstin_key" ON "public"."Clients"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_phoneNumber_key" ON "public"."Clients"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_email_key" ON "public"."Clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_gstin_key" ON "public"."User"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "public"."User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

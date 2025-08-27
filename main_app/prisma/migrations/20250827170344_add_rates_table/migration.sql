-- CreateEnum
CREATE TYPE "public"."RateType" AS ENUM ('CURRENT');

-- CreateEnum
CREATE TYPE "public"."CurrencyType" AS ENUM ('UPI', 'CDM');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "buyRate" DECIMAL(65,30),
ADD COLUMN     "sellRate" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "public"."rates" (
    "id" TEXT NOT NULL,
    "type" "public"."RateType" NOT NULL,
    "currency" "public"."CurrencyType" NOT NULL DEFAULT 'UPI',
    "buyRate" DECIMAL(65,30) NOT NULL,
    "sellRate" DECIMAL(65,30) NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rates_type_currency_key" ON "public"."rates"("type", "currency");

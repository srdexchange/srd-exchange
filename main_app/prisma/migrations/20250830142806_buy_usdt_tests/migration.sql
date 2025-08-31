-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'ADMIN_SENT_PAYMENT_INFO';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'PAYMENT_VERIFIED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'USDT_TRANSFERRED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'USDT_RECEIVED_BY_ADMIN';

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "isCompletedOnChain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerifiedOnChain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transactionHash" TEXT;

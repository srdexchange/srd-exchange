-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'PENDING_ADMIN_PAYMENT';

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "customAmount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "userConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "userConfirmedReceived" BOOLEAN NOT NULL DEFAULT false;

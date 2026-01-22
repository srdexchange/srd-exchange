/*
  Warnings:

  - A unique constraint covering the columns `[smartWalletAddress]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "smartWalletAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_smartWalletAddress_key" ON "users"("smartWalletAddress");

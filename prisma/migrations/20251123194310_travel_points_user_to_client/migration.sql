/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `TravelPointsTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `TravelPointsTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `travelPoints` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TravelPointsTransaction" DROP CONSTRAINT "TravelPointsTransaction_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TravelPointsTransaction" DROP CONSTRAINT "TravelPointsTransaction_toUserId_fkey";

-- DropIndex
DROP INDEX "public"."TravelPointsTransaction_fromUserId_idx";

-- DropIndex
DROP INDEX "public"."TravelPointsTransaction_toUserId_idx";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "travelPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TravelPointsTransaction" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "fromClientId" TEXT,
ADD COLUMN     "toClientId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "travelPoints";

-- CreateIndex
CREATE INDEX "TravelPointsTransaction_fromClientId_idx" ON "TravelPointsTransaction"("fromClientId");

-- CreateIndex
CREATE INDEX "TravelPointsTransaction_toClientId_idx" ON "TravelPointsTransaction"("toClientId");

-- AddForeignKey
ALTER TABLE "TravelPointsTransaction" ADD CONSTRAINT "TravelPointsTransaction_fromClientId_fkey" FOREIGN KEY ("fromClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPointsTransaction" ADD CONSTRAINT "TravelPointsTransaction_toClientId_fkey" FOREIGN KEY ("toClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

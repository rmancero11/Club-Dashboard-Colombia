-- CreateEnum
CREATE TYPE "TravelPointsTransactionType" AS ENUM ('ADMIN_GRANT', 'TRANSFER', 'ADJUSTMENT', 'REDEEM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "travelPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TravelPointsTransaction" (
    "id" TEXT NOT NULL,
    "type" "TravelPointsTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelPointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelPointsTransaction_fromUserId_idx" ON "TravelPointsTransaction"("fromUserId");

-- CreateIndex
CREATE INDEX "TravelPointsTransaction_toUserId_idx" ON "TravelPointsTransaction"("toUserId");

-- CreateIndex
CREATE INDEX "TravelPointsTransaction_type_createdAt_idx" ON "TravelPointsTransaction"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "TravelPointsTransaction" ADD CONSTRAINT "TravelPointsTransaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPointsTransaction" ADD CONSTRAINT "TravelPointsTransaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

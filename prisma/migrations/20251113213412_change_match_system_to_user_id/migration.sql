/*
  Warnings:

  - You are about to drop the column `fromClientId` on the `ClientLike` table. All the data in the column will be lost.
  - You are about to drop the column `toClientId` on the `ClientLike` table. All the data in the column will be lost.
  - You are about to drop the column `clientAId` on the `ClientMatch` table. All the data in the column will be lost.
  - You are about to drop the column `clientBId` on the `ClientMatch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromUserId,toUserId]` on the table `ClientLike` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userAId,userBId]` on the table `ClientMatch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromUserId` to the `ClientLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toUserId` to the `ClientLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAId` to the `ClientMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userBId` to the `ClientMatch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientLike" DROP CONSTRAINT "ClientLike_fromClientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientLike" DROP CONSTRAINT "ClientLike_toClientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientMatch" DROP CONSTRAINT "ClientMatch_clientAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientMatch" DROP CONSTRAINT "ClientMatch_clientBId_fkey";

-- DropIndex
DROP INDEX "public"."ClientLike_fromClientId_toClientId_key";

-- DropIndex
DROP INDEX "public"."ClientMatch_clientAId_clientBId_key";

-- AlterTable
ALTER TABLE "ClientLike" DROP COLUMN "fromClientId",
DROP COLUMN "toClientId",
ADD COLUMN     "fromUserId" TEXT NOT NULL,
ADD COLUMN     "toUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClientMatch" DROP COLUMN "clientAId",
DROP COLUMN "clientBId",
ADD COLUMN     "userAId" TEXT NOT NULL,
ADD COLUMN     "userBId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClientLike_fromUserId_toUserId_key" ON "ClientLike"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMatch_userAId_userBId_key" ON "ClientMatch"("userAId", "userBId");

-- AddForeignKey
ALTER TABLE "ClientLike" ADD CONSTRAINT "ClientLike_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientLike" ADD CONSTRAINT "ClientLike_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMatch" ADD CONSTRAINT "ClientMatch_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMatch" ADD CONSTRAINT "ClientMatch_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

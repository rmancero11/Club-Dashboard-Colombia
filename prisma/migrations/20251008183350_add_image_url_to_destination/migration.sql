/*
  Warnings:

  - Made the column `userId` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_userId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "imageUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

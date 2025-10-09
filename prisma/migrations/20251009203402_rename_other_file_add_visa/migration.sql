/*
  Warnings:

  - You are about to drop the column `otherFile` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otherFile",
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "visa" TEXT;

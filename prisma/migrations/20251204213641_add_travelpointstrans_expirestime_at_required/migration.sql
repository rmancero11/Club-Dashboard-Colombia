/*
  Warnings:

  - Made the column `expiresAt` on table `TravelPointsTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TravelPointsTransaction" ALTER COLUMN "expiresAt" SET NOT NULL;

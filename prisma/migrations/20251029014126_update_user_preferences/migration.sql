/*
  Warnings:

  - The `preference` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `destino` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "preference",
ADD COLUMN     "preference" TEXT[],
DROP COLUMN "destino",
ADD COLUMN     "destino" TEXT[];

/*
  Warnings:

  - You are about to drop the column `businessId` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Branch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Business` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,country,city]` on the table `Destination` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ActivityLog" DROP CONSTRAINT "ActivityLog_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Branch" DROP CONSTRAINT "Branch_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Destination" DROP CONSTRAINT "Destination_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_businessId_fkey";

-- DropIndex
DROP INDEX "public"."ActivityLog_businessId_action_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Client_businessId_sellerId_name_idx";

-- DropIndex
DROP INDEX "public"."Destination_businessId_isActive_popularityScore_idx";

-- DropIndex
DROP INDEX "public"."Destination_businessId_name_country_city_key";

-- DropIndex
DROP INDEX "public"."Reservation_businessId_sellerId_status_idx";

-- DropIndex
DROP INDEX "public"."Task_businessId_sellerId_status_priority_idx";

-- DropIndex
DROP INDEX "public"."User_businessId_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "businessId";

-- DropTable
DROP TABLE "public"."Branch";

-- DropTable
DROP TABLE "public"."Business";

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Client_sellerId_name_idx" ON "Client"("sellerId", "name");

-- CreateIndex
CREATE INDEX "Destination_isActive_popularityScore_idx" ON "Destination"("isActive", "popularityScore");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_country_city_key" ON "Destination"("name", "country", "city");

-- CreateIndex
CREATE INDEX "Reservation_sellerId_status_idx" ON "Reservation"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Task_sellerId_status_priority_idx" ON "Task"("sellerId", "status", "priority");

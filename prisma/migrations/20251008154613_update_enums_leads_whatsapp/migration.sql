/*
  Warnings:

  - The values [DRAFT,PENDING] on the enum `ReservationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dniFile` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otherFile` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'LEAD_CREATED_FROM_WP';
ALTER TYPE "ActivityAction" ADD VALUE 'LEAD_ASSIGNED';
ALTER TYPE "ActivityAction" ADD VALUE 'QUOTE_SENT';
ALTER TYPE "ActivityAction" ADD VALUE 'HOLD_SET';
ALTER TYPE "ActivityAction" ADD VALUE 'EXPIRED_AUTO';
ALTER TYPE "ActivityAction" ADD VALUE 'WHATSAPP_SENT';
ALTER TYPE "ActivityAction" ADD VALUE 'WHATSAPP_RECEIVED';

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('LEAD', 'QUOTED', 'HOLD', 'CONFIRMED', 'TRAVELING', 'COMPLETED', 'CANCELED', 'EXPIRED');
ALTER TABLE "public"."Reservation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Reservation" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::text::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "public"."ReservationStatus_old";
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'LEAD';
COMMIT;

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dniFile",
DROP COLUMN "otherFile";

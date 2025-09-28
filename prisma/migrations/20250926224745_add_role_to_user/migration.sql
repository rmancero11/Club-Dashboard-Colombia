/*
  Warnings:

  - You are about to drop the column `Role` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "Role",
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'USER';

/*
  Warnings:

  - The `SocialMedia` column on the `Business` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Business" DROP COLUMN "SocialMedia",
ADD COLUMN     "SocialMedia" JSONB;

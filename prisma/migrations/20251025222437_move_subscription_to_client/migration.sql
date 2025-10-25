/*
  Warnings:

  - You are about to drop the column `subscriptionPlan` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_role_subscriptionPlan_idx";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscriptionPlan";

-- CreateIndex
CREATE INDEX "Client_sellerId_subscriptionPlan_idx" ON "Client"("sellerId", "subscriptionPlan");

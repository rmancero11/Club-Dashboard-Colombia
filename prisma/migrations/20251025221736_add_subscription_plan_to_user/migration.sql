-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STANDARD', 'PREMIUM', 'VIP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX "User_role_subscriptionPlan_idx" ON "User"("role", "subscriptionPlan");

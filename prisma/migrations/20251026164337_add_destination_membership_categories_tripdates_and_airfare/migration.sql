/*
  Warnings:

  - You are about to drop the column `category` on the `Destination` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AirfareOption" AS ENUM ('WITH_AIRFARE', 'WITHOUT_AIRFARE');

-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "category",
ADD COLUMN     "baseFromCOP" DECIMAL(14,2),
ADD COLUMN     "baseFromUSD" DECIMAL(12,2),
ADD COLUMN     "membership" "SubscriptionPlan" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "priceCOPWithAirfare" DECIMAL(14,2),
ADD COLUMN     "priceCOPWithoutAirfare" DECIMAL(14,2),
ADD COLUMN     "priceUSDWithAirfare" DECIMAL(12,2),
ADD COLUMN     "priceUSDWithoutAirfare" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "airfareOption" "AirfareOption" NOT NULL DEFAULT 'WITHOUT_AIRFARE',
ADD COLUMN     "tripDateId" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDate" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToDestination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToDestination_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "TripDate_destinationId_startDate_endDate_idx" ON "TripDate"("destinationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "TripDate_isActive_idx" ON "TripDate"("isActive");

-- CreateIndex
CREATE INDEX "_CategoryToDestination_B_index" ON "_CategoryToDestination"("B");

-- CreateIndex
CREATE INDEX "Destination_membership_idx" ON "Destination"("membership");

-- CreateIndex
CREATE INDEX "Reservation_tripDateId_idx" ON "Reservation"("tripDateId");

-- AddForeignKey
ALTER TABLE "TripDate" ADD CONSTRAINT "TripDate_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tripDateId_fkey" FOREIGN KEY ("tripDateId") REFERENCES "TripDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToDestination" ADD CONSTRAINT "_CategoryToDestination_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToDestination" ADD CONSTRAINT "_CategoryToDestination_B_fkey" FOREIGN KEY ("B") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

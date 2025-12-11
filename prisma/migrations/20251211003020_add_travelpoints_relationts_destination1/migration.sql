-- AlterTable
ALTER TABLE "TravelPointsTransaction" ADD COLUMN     "validFrom" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TravelPointsDestination" (
    "id" TEXT NOT NULL,
    "travelPointsId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "TravelPointsDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelPointsDestination_destinationId_idx" ON "TravelPointsDestination"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "TravelPointsDestination_travelPointsId_destinationId_key" ON "TravelPointsDestination"("travelPointsId", "destinationId");

-- AddForeignKey
ALTER TABLE "TravelPointsDestination" ADD CONSTRAINT "TravelPointsDestination_travelPointsId_fkey" FOREIGN KEY ("travelPointsId") REFERENCES "TravelPointsTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPointsDestination" ADD CONSTRAINT "TravelPointsDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;



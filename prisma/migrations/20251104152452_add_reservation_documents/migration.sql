-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_ORDER', 'FLIGHT_TICKETS', 'SERVICE_VOUCHER', 'MEDICAL_ASSISTANCE_CARD', 'TRAVEL_TIPS');

-- CreateTable
CREATE TABLE "ReservationDocument" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "ReservationDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservationDocument" ADD CONSTRAINT "ReservationDocument_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationDocument" ADD CONSTRAINT "ReservationDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

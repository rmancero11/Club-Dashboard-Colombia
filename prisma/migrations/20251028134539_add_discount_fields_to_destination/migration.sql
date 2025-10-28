-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "discountCOPWithAirfarePercent" DECIMAL(5,2),
ADD COLUMN     "discountCOPWithoutAirfarePercent" DECIMAL(5,2),
ADD COLUMN     "discountUSDWithAirfarePercent" DECIMAL(5,2),
ADD COLUMN     "discountUSDWithoutAirfarePercent" DECIMAL(5,2),
ADD COLUMN     "listCOPWithAirfare" DECIMAL(14,2),
ADD COLUMN     "listCOPWithoutAirfare" DECIMAL(14,2),
ADD COLUMN     "listUSDWithAirfare" DECIMAL(12,2),
ADD COLUMN     "listUSDWithoutAirfare" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedTerms" BOOLEAN,
ADD COLUMN     "affirmation" TEXT,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "flow" TEXT,
ADD COLUMN     "singleStatus" TEXT;

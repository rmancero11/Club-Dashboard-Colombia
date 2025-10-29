-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "sellerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignmentWeight" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "autoAssignable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxActiveClients" INTEGER;

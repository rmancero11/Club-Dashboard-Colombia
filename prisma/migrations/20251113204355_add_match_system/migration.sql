-- CreateTable
CREATE TABLE "ClientLike" (
    "id" TEXT NOT NULL,
    "fromClientId" TEXT NOT NULL,
    "toClientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMatch" (
    "id" TEXT NOT NULL,
    "clientAId" TEXT NOT NULL,
    "clientBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientLike_fromClientId_toClientId_key" ON "ClientLike"("fromClientId", "toClientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMatch_clientAId_clientBId_key" ON "ClientMatch"("clientAId", "clientBId");

-- AddForeignKey
ALTER TABLE "ClientLike" ADD CONSTRAINT "ClientLike_fromClientId_fkey" FOREIGN KEY ("fromClientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientLike" ADD CONSTRAINT "ClientLike_toClientId_fkey" FOREIGN KEY ("toClientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMatch" ADD CONSTRAINT "ClientMatch_clientAId_fkey" FOREIGN KEY ("clientAId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMatch" ADD CONSTRAINT "ClientMatch_clientBId_fkey" FOREIGN KEY ("clientBId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

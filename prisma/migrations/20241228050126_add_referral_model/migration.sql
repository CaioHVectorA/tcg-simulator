-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fromReferralId" INTEGER;

-- CreateTable
CREATE TABLE "ReferrerProtocol" (
    "id" SERIAL NOT NULL,
    "referrerCreatorId" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "ReferrerProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referred" (
    "id" SERIAL NOT NULL,
    "referredId" INTEGER NOT NULL,
    "referrerProtocolId" INTEGER NOT NULL,

    CONSTRAINT "Referred_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerProtocol_hash_key" ON "ReferrerProtocol"("hash");

-- AddForeignKey
ALTER TABLE "ReferrerProtocol" ADD CONSTRAINT "ReferrerProtocol_referrerCreatorId_fkey" FOREIGN KEY ("referrerCreatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referred" ADD CONSTRAINT "Referred_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referred" ADD CONSTRAINT "Referred_referrerProtocolId_fkey" FOREIGN KEY ("referrerProtocolId") REFERENCES "ReferrerProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `trade_id` on the `trade_requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `trade_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tradeId]` on the table `trade_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash]` on the table `trades` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tradeId` to the `trade_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acceptMoney` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acceptOffers` to the `trades` table without a default value. This is not possible if the table is not empty.
  - The required column `hash` was added to the `trades` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `trades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "trade_requests" DROP CONSTRAINT "trade_requests_trade_id_fkey";

-- AlterTable
ALTER TABLE "trade_requests" DROP COLUMN "trade_id",
ADD COLUMN     "tradeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "acceptMoney" BOOLEAN NOT NULL,
ADD COLUMN     "acceptOffers" BOOLEAN NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "maxRarity" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "minRarity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "moneyReceiving" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "moneySending" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "protocol" TEXT NOT NULL DEFAULT '1x1',
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "trade_offers" (
    "id" SERIAL NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "money" INTEGER NOT NULL,

    CONSTRAINT "trade_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_offer_cards" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_offer_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trade_requests_id_key" ON "trade_requests"("id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_requests_tradeId_key" ON "trade_requests"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "trades_hash_key" ON "trades"("hash");

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offer_cards" ADD CONSTRAINT "trade_offer_cards_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trade_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offer_cards" ADD CONSTRAINT "trade_offer_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_requests" ADD CONSTRAINT "trade_requests_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

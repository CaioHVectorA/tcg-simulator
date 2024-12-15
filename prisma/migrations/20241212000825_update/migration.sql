/*
  Warnings:

  - You are about to drop the `Card` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friend_User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trade_Card` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User_Trade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friend_User" DROP CONSTRAINT "Friend_User_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "Friend_User" DROP CONSTRAINT "Friend_User_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Trade_Card" DROP CONSTRAINT "Trade_Card_card_id_fkey";

-- DropForeignKey
ALTER TABLE "Trade_Card" DROP CONSTRAINT "Trade_Card_trade_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Trade" DROP CONSTRAINT "User_Trade_trade_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Trade" DROP CONSTRAINT "User_Trade_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cards_user" DROP CONSTRAINT "cards_user_cardId_fkey";

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "tcg_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "picture" TEXT NOT NULL DEFAULT '/wallpaper.jpg';

-- DropTable
DROP TABLE "Card";

-- DropTable
DROP TABLE "Friend_User";

-- DropTable
DROP TABLE "Trade_Card";

-- DropTable
DROP TABLE "User_Trade";

-- CreateTable
CREATE TABLE "cards" (
    "name" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "card_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_trade" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "is_sender" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_card" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "is_sender" BOOLEAN NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_user" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "friend_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ranking" (
    "user_id" INTEGER NOT NULL,
    "total_rarity" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Promotional_Cards" (
    "card_id" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "original_price" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotional_Cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "error" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_card_id_key" ON "cards"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_ranking_user_id_key" ON "user_ranking"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "cards_user" ADD CONSTRAINT "cards_user_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trade" ADD CONSTRAINT "user_trade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trade" ADD CONSTRAINT "user_trade_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_card" ADD CONSTRAINT "trade_card_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_card" ADD CONSTRAINT "trade_card_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_user" ADD CONSTRAINT "friend_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_user" ADD CONSTRAINT "friend_user_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ranking" ADD CONSTRAINT "user_ranking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotional_Cards" ADD CONSTRAINT "Promotional_Cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

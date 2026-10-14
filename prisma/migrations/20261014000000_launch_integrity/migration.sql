-- Stop rather than delete/merge existing trainers or quest progress.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users GROUP BY lower(trim(email)) HAVING count(*) > 1) OR
     EXISTS (SELECT 1 FROM users GROUP BY lower(trim(username)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Resolve duplicate normalized emails/usernames before launch migration';
  END IF;
  IF EXISTS (SELECT 1 FROM quest_user GROUP BY user_id, quest_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Resolve duplicate quest progress before launch migration';
  END IF;
END $$;
BEGIN;
-- DropForeignKey
ALTER TABLE "public"."trade_requests" DROP CONSTRAINT "trade_requests_trade_id_fkey";

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "requestHash" TEXT,
ADD COLUMN     "result" JSONB;

-- AlterTable
ALTER TABLE "public"."trade_requests" RENAME COLUMN "trade_id" TO "tradeId";

-- AlterTable
ALTER TABLE "public"."trades" ADD COLUMN     "acceptMoney" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptOffers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "hash" TEXT,
ADD COLUMN     "maxRarity" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "minRarity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "moneyReceiving" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "moneySending" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Legacy trade',
ADD COLUMN     "protocol" TEXT NOT NULL DEFAULT '1x1',
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true;

UPDATE "public"."trades" SET hash = 'legacy-' || id::text WHERE hash IS NULL;
ALTER TABLE "public"."trades" ALTER COLUMN hash SET NOT NULL;
ALTER TABLE "public"."trades" ALTER COLUMN "acceptMoney" DROP DEFAULT, ALTER COLUMN "acceptOffers" DROP DEFAULT, ALTER COLUMN name DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "googleSubject" TEXT,
ALTER COLUMN "last_daily_bounty" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."favorite_cards" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trade_marked_cards" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_marked_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_deck_cards" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_battle_records" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "npcId" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL DEFAULT true,
    "playerScore" INTEGER NOT NULL DEFAULT 0,
    "opponentScore" INTEGER NOT NULL DEFAULT 0,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_battle_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_level_rewards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_level_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trade_offer_cards" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_offer_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trade_offers" (
    "id" SERIAL NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "money" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_cards_userId_cardId_key" ON "public"."favorite_cards"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "trade_marked_cards_userId_cardId_key" ON "public"."trade_marked_cards"("userId", "cardId");

-- CreateIndex
CREATE INDEX "user_deck_cards_userId_idx" ON "public"."user_deck_cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_deck_cards_userId_slot_key" ON "public"."user_deck_cards"("userId", "slot");

-- CreateIndex
CREATE INDEX "user_battle_records_userId_idx" ON "public"."user_battle_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_level_rewards_user_id_level_key" ON "public"."user_level_rewards"("user_id", "level");

-- CreateIndex
CREATE INDEX "trade_offer_cards_trade_id_idx" ON "public"."trade_offer_cards"("trade_id");

-- CreateIndex
CREATE INDEX "trade_offer_cards_card_id_idx" ON "public"."trade_offer_cards"("card_id");

-- CreateIndex
CREATE INDEX "trade_offers_trade_id_idx" ON "public"."trade_offers"("trade_id");

-- CreateIndex
CREATE INDEX "trade_offers_user_id_idx" ON "public"."trade_offers"("user_id");

-- CreateIndex
CREATE INDEX "cards_rarity_idx" ON "public"."cards"("rarity");

-- CreateIndex
CREATE INDEX "cards_type_idx" ON "public"."cards"("type");

-- CreateIndex
CREATE INDEX "cards_user_userId_idx" ON "public"."cards_user"("userId");

-- CreateIndex
CREATE INDEX "cards_user_cardId_idx" ON "public"."cards_user"("cardId");

-- CreateIndex
CREATE INDEX "cards_user_userId_cardId_idx" ON "public"."cards_user"("userId", "cardId");

-- CreateIndex
CREATE INDEX "messages_receiver_id_viewed_idx" ON "public"."messages"("receiver_id", "viewed");

-- CreateIndex
CREATE INDEX "messages_sender_id_receiver_id_idx" ON "public"."messages"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "money_donate_receiver_id_idx" ON "public"."money_donate"("receiver_id");

-- CreateIndex
CREATE INDEX "money_donate_sender_id_idx" ON "public"."money_donate"("sender_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_viewed_idx" ON "public"."notifications"("user_id", "viewed");

-- CreateIndex
CREATE INDEX "packages_user_userId_idx" ON "public"."packages_user"("userId");

-- CreateIndex
CREATE INDEX "packages_user_userId_opened_idx" ON "public"."packages_user"("userId", "opened");

-- CreateIndex
CREATE INDEX "quest_user_user_id_idx" ON "public"."quest_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "quest_user_user_id_quest_id_key" ON "public"."quest_user"("user_id", "quest_id");

-- CreateIndex
CREATE INDEX "trade_card_card_id_idx" ON "public"."trade_card"("card_id");

-- CreateIndex
CREATE INDEX "trade_card_trade_id_idx" ON "public"."trade_card"("trade_id");

-- CreateIndex
CREATE INDEX "trade_card_trade_id_is_sender_idx" ON "public"."trade_card"("trade_id", "is_sender");

-- CreateIndex
CREATE UNIQUE INDEX "trade_requests_id_key" ON "public"."trade_requests"("id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_requests_tradeId_key" ON "public"."trade_requests"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "trades_hash_key" ON "public"."trades"("hash");

-- CreateIndex
CREATE INDEX "trades_public_createdAt_idx" ON "public"."trades"("public", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "trades_public_minRarity_maxRarity_idx" ON "public"."trades"("public", "minRarity", "maxRarity");

-- CreateIndex
CREATE INDEX "user_purchase_user_id_idx" ON "public"."user_purchase"("user_id");

-- CreateIndex
CREATE INDEX "user_trade_user_id_idx" ON "public"."user_trade"("user_id");

-- CreateIndex
CREATE INDEX "user_trade_trade_id_idx" ON "public"."user_trade"("trade_id");

-- CreateIndex
CREATE INDEX "user_trade_trade_id_is_sender_idx" ON "public"."user_trade"("trade_id", "is_sender");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSubject_key" ON "public"."users"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."favorite_cards" ADD CONSTRAINT "favorite_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_cards" ADD CONSTRAINT "favorite_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_marked_cards" ADD CONSTRAINT "trade_marked_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_marked_cards" ADD CONSTRAINT "trade_marked_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_deck_cards" ADD CONSTRAINT "user_deck_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_deck_cards" ADD CONSTRAINT "user_deck_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_battle_records" ADD CONSTRAINT "user_battle_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_offer_cards" ADD CONSTRAINT "trade_offer_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_offer_cards" ADD CONSTRAINT "trade_offer_cards_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trade_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_offers" ADD CONSTRAINT "trade_offers_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_offers" ADD CONSTRAINT "trade_offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_requests" ADD CONSTRAINT "trade_requests_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE UNIQUE INDEX users_email_normalized_key ON users (lower(trim(email)));
CREATE UNIQUE INDEX users_username_normalized_key ON users (lower(trim(username)));
ALTER TABLE users ADD CONSTRAINT users_money_nonnegative CHECK (money >= 0);
COMMIT;

/*
  Warnings:

  - You are about to drop the column `promotional_card_id` on the `user_purchase` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_purchase" DROP CONSTRAINT "user_purchase_promotional_card_id_fkey";

-- AlterTable
ALTER TABLE "user_purchase" DROP COLUMN "promotional_card_id",
ADD COLUMN     "card_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `userId` on the `Card` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "name" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "card_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL
);
INSERT INTO "new_Card" ("card_id", "id", "image_url", "name", "rarity") SELECT "card_id", "id", "image_url", "name", "rarity" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE UNIQUE INDEX "Card_card_id_key" ON "Card"("card_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

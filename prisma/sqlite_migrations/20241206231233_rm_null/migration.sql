/*
  Warnings:

  - Made the column `original_price` on table `Promotional_Cards` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotional_Cards" (
    "card_id" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "original_price" INTEGER NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotional_Cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Promotional_Cards" ("card_id", "created_at", "id", "original_price", "price", "updated_at") SELECT "card_id", "created_at", "id", "original_price", "price", "updated_at" FROM "Promotional_Cards";
DROP TABLE "Promotional_Cards";
ALTER TABLE "new_Promotional_Cards" RENAME TO "Promotional_Cards";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

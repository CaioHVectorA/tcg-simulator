/*
  Warnings:

  - Added the required column `cards_quantity` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Package" (
    "price" INTEGER NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "common_rarity" REAL NOT NULL,
    "rare_rarity" REAL NOT NULL,
    "epic_rarity" REAL NOT NULL,
    "legendary_rarity" REAL NOT NULL,
    "full_legendary_rarity" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "userId" INTEGER,
    "cards_quantity" INTEGER NOT NULL,
    CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Package" ("common_rarity", "epic_rarity", "full_legendary_rarity", "id", "image_url", "legendary_rarity", "name", "price", "rare_rarity", "userId") SELECT "common_rarity", "epic_rarity", "full_legendary_rarity", "id", "image_url", "legendary_rarity", "name", "price", "rare_rarity", "userId" FROM "Package";
DROP TABLE "Package";
ALTER TABLE "new_Package" RENAME TO "Package";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

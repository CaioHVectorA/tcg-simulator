/*
  Warnings:

  - You are about to drop the column `userId` on the `Package` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Packages_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    CONSTRAINT "Packages_User_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Packages_User_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "cards_quantity" INTEGER NOT NULL
);
INSERT INTO "new_Package" ("cards_quantity", "common_rarity", "epic_rarity", "full_legendary_rarity", "id", "image_url", "legendary_rarity", "name", "price", "rare_rarity") SELECT "cards_quantity", "common_rarity", "epic_rarity", "full_legendary_rarity", "id", "image_url", "legendary_rarity", "name", "price", "rare_rarity" FROM "Package";
DROP TABLE "Package";
ALTER TABLE "new_Package" RENAME TO "Package";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

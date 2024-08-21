/*
  Warnings:

  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Packages_User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Package";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Packages_User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "packages" (
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

-- CreateTable
CREATE TABLE "packages_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    CONSTRAINT "packages_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_user_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "money" INTEGER NOT NULL DEFAULT 500
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "name" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "card_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("card_id", "id", "image_url", "name", "rarity", "userId") SELECT "card_id", "id", "image_url", "name", "rarity", "userId" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE UNIQUE INDEX "Card_card_id_key" ON "Card"("card_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

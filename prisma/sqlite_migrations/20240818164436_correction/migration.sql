/*
  Warnings:

  - You are about to drop the column `userId` on the `Friend_User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friend_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "friend_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friend_User_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friend_User_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Friend_User" ("accepted", "createdAt", "friend_id", "id", "updatedAt", "user_id") SELECT "accepted", "createdAt", "friend_id", "id", "updatedAt", "user_id" FROM "Friend_User";
DROP TABLE "Friend_User";
ALTER TABLE "new_Friend_User" RENAME TO "Friend_User";
CREATE UNIQUE INDEX "Friend_User_user_id_friend_id_key" ON "Friend_User"("user_id", "friend_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

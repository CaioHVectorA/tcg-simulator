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
    CONSTRAINT "Friend_User_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friend_User_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Friend_User" ("accepted", "createdAt", "friend_id", "id", "updatedAt", "user_id") SELECT "accepted", "createdAt", "friend_id", "id", "updatedAt", "user_id" FROM "Friend_User";
DROP TABLE "Friend_User";
ALTER TABLE "new_Friend_User" RENAME TO "Friend_User";
CREATE TABLE "new_Trade_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "card_id" INTEGER NOT NULL,
    "is_sender" BOOLEAN NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_Card_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_Card_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trade_Card" ("card_id", "createdAt", "id", "is_sender", "trade_id", "updatedAt") SELECT "card_id", "createdAt", "id", "is_sender", "trade_id", "updatedAt" FROM "Trade_Card";
DROP TABLE "Trade_Card";
ALTER TABLE "new_Trade_Card" RENAME TO "Trade_Card";
CREATE TABLE "new_User_Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "is_sender" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_Trade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "User_Trade_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User_Trade" ("createdAt", "id", "is_sender", "trade_id", "updatedAt", "user_id") SELECT "createdAt", "id", "is_sender", "trade_id", "updatedAt", "user_id" FROM "User_Trade";
DROP TABLE "User_Trade";
ALTER TABLE "new_User_Trade" RENAME TO "User_Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

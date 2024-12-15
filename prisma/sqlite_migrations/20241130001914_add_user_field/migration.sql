-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_ranking" (
    "user_id" INTEGER NOT NULL,
    "total_rarity" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    CONSTRAINT "user_ranking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_ranking" ("position", "total_rarity", "user_id") SELECT "position", "total_rarity", "user_id" FROM "user_ranking";
DROP TABLE "user_ranking";
ALTER TABLE "new_user_ranking" RENAME TO "user_ranking";
CREATE UNIQUE INDEX "user_ranking_user_id_key" ON "user_ranking"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - You are about to drop the `User_Ranking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User_Ranking";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "user_ranking" (
    "user_id" INTEGER NOT NULL,
    "total_rarity" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_ranking_user_id_key" ON "user_ranking"("user_id");

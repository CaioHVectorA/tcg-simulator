-- CreateTable
CREATE TABLE "User_Ranking" (
    "user_id" INTEGER NOT NULL,
    "total_rarity" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Ranking_user_id_key" ON "User_Ranking"("user_id");

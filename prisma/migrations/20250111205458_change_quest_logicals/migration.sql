/*
  Warnings:

  - You are about to drop the column `current` on the `quest_user` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `quests` table. All the data in the column will be lost.
  - Added the required column `description` to the `quests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelCount` to the `quests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `quests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `queryCheck` to the `quests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "quest_user" DROP COLUMN "current",
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "quests" DROP COLUMN "key",
DROP COLUMN "model",
DROP COLUMN "value",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "levelCount" INTEGER NOT NULL,
ADD COLUMN     "levelGoals" INTEGER[],
ADD COLUMN     "levelRewards" INTEGER[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "queryCheck" TEXT NOT NULL;

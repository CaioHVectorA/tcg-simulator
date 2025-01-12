/*
  Warnings:

  - You are about to drop the column `reward` on the `quests` table. All the data in the column will be lost.
  - The `description` column on the `quests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "quests" DROP COLUMN "reward",
DROP COLUMN "description",
ADD COLUMN     "description" TEXT[];

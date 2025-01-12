-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "hp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "reward" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "viewed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "trade_requests" ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;

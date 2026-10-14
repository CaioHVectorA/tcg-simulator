-- REVIEW ONLY: patch for the drifted existing database inspected on 2026-10-14.
-- Never run instead of normal migrations on a fresh database.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users GROUP BY lower(trim(email)) HAVING count(*) > 1) OR
     EXISTS (SELECT 1 FROM users GROUP BY lower(trim(username)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Resolve normalized account duplicates before release';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE money < 0) THEN
    RAISE EXCEPTION 'Reconcile negative balances before release';
  END IF;
END $$;
-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "requestHash" TEXT,
ADD COLUMN     "result" JSONB;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "authVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "googleSubject" TEXT;

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "public"."password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "public"."password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSubject_key" ON "public"."users"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_key ON users (lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_normalized_key ON users (lower(trim(username)));
ALTER TABLE users ADD CONSTRAINT users_money_nonnegative CHECK (money >= 0);
COMMIT;

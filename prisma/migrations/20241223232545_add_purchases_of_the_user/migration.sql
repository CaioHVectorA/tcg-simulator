-- CreateTable
CREATE TABLE "user_purchase" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "package_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotional_card_id" INTEGER,

    CONSTRAINT "user_purchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_promotional_card_id_fkey" FOREIGN KEY ("promotional_card_id") REFERENCES "Promotional_Cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

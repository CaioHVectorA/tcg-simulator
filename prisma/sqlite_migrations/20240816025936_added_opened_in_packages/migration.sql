-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_packages_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "packages_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_user_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_packages_user" ("id", "packageId", "userId") SELECT "id", "packageId", "userId" FROM "packages_user";
DROP TABLE "packages_user";
ALTER TABLE "new_packages_user" RENAME TO "packages_user";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

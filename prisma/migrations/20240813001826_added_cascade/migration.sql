-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Packages_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    CONSTRAINT "Packages_User_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Packages_User_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Packages_User" ("id", "packageId", "userId") SELECT "id", "packageId", "userId" FROM "Packages_User";
DROP TABLE "Packages_User";
ALTER TABLE "new_Packages_User" RENAME TO "Packages_User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

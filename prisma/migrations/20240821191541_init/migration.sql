/*
  Warnings:

  - You are about to drop the `WebSevice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `webSeviceId` on the `EnvVar` table. All the data in the column will be lost.
  - Added the required column `webServiceId` to the `EnvVar` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WebSevice_serviceId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WebSevice";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WebService" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gitHubUrl" TEXT NOT NULL,
    "mainBranch" TEXT NOT NULL,
    "buildCommand" TEXT NOT NULL,
    "startCommand" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    CONSTRAINT "WebService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EnvVar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "webServiceId" INTEGER NOT NULL,
    CONSTRAINT "EnvVar_webServiceId_fkey" FOREIGN KEY ("webServiceId") REFERENCES "WebService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EnvVar" ("createdAt", "id", "key", "value") SELECT "createdAt", "id", "key", "value" FROM "EnvVar";
DROP TABLE "EnvVar";
ALTER TABLE "new_EnvVar" RENAME TO "EnvVar";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WebService_serviceId_key" ON "WebService"("serviceId");

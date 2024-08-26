/*
  Warnings:

  - Added the required column `adminId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "port" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'webService',
    "serviceRuntime" TEXT NOT NULL DEFAULT 'nodejs',
    "dockerImage" TEXT NOT NULL,
    "dockerVersion" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    CONSTRAINT "Service_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Service_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("createdAt", "description", "dockerImage", "dockerVersion", "id", "name", "port", "projectId", "serviceRuntime", "serviceType", "adminId") SELECT "createdAt", "description", "dockerImage", "dockerVersion", "id", "name", "port", "projectId", "serviceRuntime", "serviceType", 1 FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

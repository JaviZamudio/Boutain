-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "githubKey" TEXT
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Service" (
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

-- CreateTable
CREATE TABLE "Database" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbName" TEXT NOT NULL,
    "dbUser" TEXT NOT NULL,
    "dbPassword" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    CONSTRAINT "Database_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvVar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "webServiceId" INTEGER NOT NULL,
    CONSTRAINT "EnvVar_webServiceId_fkey" FOREIGN KEY ("webServiceId") REFERENCES "WebService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "WebService_serviceId_key" ON "WebService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Database_serviceId_key" ON "Database"("serviceId");


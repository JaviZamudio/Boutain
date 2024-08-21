/*
  Warnings:

  - A unique constraint covering the columns `[serviceId]` on the table `Database` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serviceId]` on the table `WebSevice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Database_serviceId_key" ON "Database"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "WebSevice_serviceId_key" ON "WebSevice"("serviceId");

/*
  Warnings:

  - A unique constraint covering the columns `[userId,agentId]` on the table `official_scripts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "official_scripts_userId_agentId_key" ON "official_scripts"("userId", "agentId");

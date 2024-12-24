/*
  Warnings:

  - You are about to drop the column `e2eLatency` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `llmLatency` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `llmWebsocketNetworkRttLatency` on the `calls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "calls" DROP COLUMN "e2eLatency",
DROP COLUMN "llmLatency",
DROP COLUMN "llmWebsocketNetworkRttLatency";

/*
  Warnings:

  - The `llmLatency` column on the `calls` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `llmWebsocketNetworkRttLatency` column on the `calls` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "calls" DROP COLUMN "llmLatency",
ADD COLUMN     "llmLatency" JSONB,
DROP COLUMN "llmWebsocketNetworkRttLatency",
ADD COLUMN     "llmWebsocketNetworkRttLatency" JSONB;

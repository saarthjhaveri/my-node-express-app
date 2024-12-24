/*
  Warnings:

  - The `e2eLatency` column on the `calls` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "calls" DROP COLUMN "e2eLatency",
ADD COLUMN     "e2eLatency" JSONB;

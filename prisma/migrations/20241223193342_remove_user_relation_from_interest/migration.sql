/*
  Warnings:

  - You are about to drop the column `userId` on the `interest_submissions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "interest_submissions" DROP CONSTRAINT "interest_submissions_userId_fkey";

-- AlterTable
ALTER TABLE "interest_submissions" DROP COLUMN "userId";

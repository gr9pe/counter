/*
  Warnings:

  - You are about to drop the column `profileId` on the `Drink` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Drink` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_profileId_fkey";

-- AlterTable
ALTER TABLE "Drink" DROP COLUMN "profileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

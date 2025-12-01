/*
  Warnings:

  - You are about to drop the column `profile_id` on the `Drink` table. All the data in the column will be lost.
  - Added the required column `profileId` to the `Drink` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_profile_id_fkey";

-- AlterTable
ALTER TABLE "Drink" DROP COLUMN "profile_id",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

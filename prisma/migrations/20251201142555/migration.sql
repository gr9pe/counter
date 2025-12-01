/*
  Warnings:

  - The primary key for the `Drink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Profile` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_profile_id_fkey";

-- AlterTable
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "profile_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Drink_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Drink_id_seq";

-- AlterTable
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Profile_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Profile_id_seq";

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

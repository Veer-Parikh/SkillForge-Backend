/*
  Warnings:

  - The primary key for the `Mentor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `expertise` column on the `Mentor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[number]` on the table `Mentor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Mentor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Mentor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mentor" DROP CONSTRAINT "Mentor_pkey",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpiration" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "expertise",
ADD COLUMN     "expertise" TEXT[],
ALTER COLUMN "availableFrom" DROP NOT NULL,
ALTER COLUMN "availableTo" DROP NOT NULL,
ADD CONSTRAINT "Mentor_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Mentor_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_number_key" ON "Mentor"("number");

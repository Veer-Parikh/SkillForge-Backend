-- AlterTable
ALTER TABLE "Mentor" ADD COLUMN     "currentUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "previousUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];

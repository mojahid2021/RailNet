/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `routes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `routes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "coachTypeId" TEXT NOT NULL,
    "coachNumber" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_trainId_coachNumber_key" ON "coaches"("trainId", "coachNumber");

-- CreateIndex
CREATE UNIQUE INDEX "routes_code_key" ON "routes"("code");

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "trains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_coachTypeId_fkey" FOREIGN KEY ("coachTypeId") REFERENCES "coach_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

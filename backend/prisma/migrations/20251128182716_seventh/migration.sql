/*
  Warnings:

  - Added the required column `trainRouteId` to the `TrainSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RouteStation" ADD COLUMN     "arrivalTime" TEXT,
ADD COLUMN     "departureTime" TEXT;

-- AlterTable
ALTER TABLE "TrainSchedule" ADD COLUMN     "trainRouteId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_trainRouteId_fkey" FOREIGN KEY ("trainRouteId") REFERENCES "TrainRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

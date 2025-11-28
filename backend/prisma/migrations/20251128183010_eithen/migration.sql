/*
  Warnings:

  - You are about to drop the column `arrivalTime` on the `RouteStation` table. All the data in the column will be lost.
  - You are about to drop the column `departureTime` on the `RouteStation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RouteStation" DROP COLUMN "arrivalTime",
DROP COLUMN "departureTime";

-- CreateTable
CREATE TABLE "ScheduleStation" (
    "id" SERIAL NOT NULL,
    "trainScheduleId" INTEGER NOT NULL,
    "stationId" INTEGER NOT NULL,
    "arrivalTime" TEXT,
    "departureTime" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleStation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduleStation" ADD CONSTRAINT "ScheduleStation_trainScheduleId_fkey" FOREIGN KEY ("trainScheduleId") REFERENCES "TrainSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleStation" ADD CONSTRAINT "ScheduleStation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

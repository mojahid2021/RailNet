/*
  Warnings:

  - You are about to drop the column `nextStationId` on the `route_stops` table. All the data in the column will be lost.
  - You are about to drop the column `prevStationId` on the `route_stops` table. All the data in the column will be lost.
  - You are about to drop the column `arrivalTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `departureTime` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `nextStationId` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `prevStationId` on the `stations` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `route_stops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "route_stops" DROP COLUMN "nextStationId",
DROP COLUMN "prevStationId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "stations" DROP COLUMN "arrivalTime",
DROP COLUMN "departureTime",
DROP COLUMN "distance",
DROP COLUMN "duration",
DROP COLUMN "nextStationId",
DROP COLUMN "prevStationId";

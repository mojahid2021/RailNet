-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "arrivalTime" TEXT,
ADD COLUMN     "departureTime" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "nextStationId" TEXT,
ADD COLUMN     "prevStationId" TEXT;

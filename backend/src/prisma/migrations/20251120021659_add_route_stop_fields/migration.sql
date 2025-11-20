-- AlterTable
ALTER TABLE "route_stops" ADD COLUMN     "distanceFromStart" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "nextStationId" TEXT,
ADD COLUMN     "prevStationId" TEXT;

-- CreateTable
CREATE TABLE "coach_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "ratePerKm" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coach_types_name_key" ON "coach_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "coach_types_code_key" ON "coach_types"("code");

-- CreateTable
CREATE TABLE "TrainSchedule" (
    "id" UUID NOT NULL,
    "trainId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationSchedule" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "stationId" UUID NOT NULL,
    "routeStationId" UUID NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "estimatedArrival" TIMESTAMP(3) NOT NULL,
    "estimatedDeparture" TIMESTAMP(3) NOT NULL,
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "durationFromPrevious" INTEGER NOT NULL,
    "waitingTime" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "platformNumber" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleUpdate" (
    "id" UUID NOT NULL,
    "stationScheduleId" UUID NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainSchedule_trainId_departureDate_key" ON "TrainSchedule"("trainId", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "StationSchedule_scheduleId_stationId_key" ON "StationSchedule"("scheduleId", "stationId");

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TrainRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationSchedule" ADD CONSTRAINT "StationSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationSchedule" ADD CONSTRAINT "StationSchedule_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationSchedule" ADD CONSTRAINT "StationSchedule_routeStationId_fkey" FOREIGN KEY ("routeStationId") REFERENCES "TrainRouteStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleUpdate" ADD CONSTRAINT "ScheduleUpdate_stationScheduleId_fkey" FOREIGN KEY ("stationScheduleId") REFERENCES "StationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

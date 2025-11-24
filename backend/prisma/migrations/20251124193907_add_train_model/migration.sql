-- CreateTable
CREATE TABLE "TrainRouteCompartment" (
    "id" UUID NOT NULL,
    "trainRouteId" UUID NOT NULL,
    "compartmentId" UUID NOT NULL,

    CONSTRAINT "TrainRouteCompartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Train" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Train_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainRouteCompartment_trainRouteId_compartmentId_key" ON "TrainRouteCompartment"("trainRouteId", "compartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Train_number_key" ON "Train"("number");

-- AddForeignKey
ALTER TABLE "TrainRouteCompartment" ADD CONSTRAINT "TrainRouteCompartment_trainRouteId_fkey" FOREIGN KEY ("trainRouteId") REFERENCES "TrainRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainRouteCompartment" ADD CONSTRAINT "TrainRouteCompartment_compartmentId_fkey" FOREIGN KEY ("compartmentId") REFERENCES "Compartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

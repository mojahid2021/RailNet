/*
  Warnings:

  - You are about to drop the `TrainRouteCompartment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrainRouteCompartment" DROP CONSTRAINT "TrainRouteCompartment_compartmentId_fkey";

-- DropForeignKey
ALTER TABLE "TrainRouteCompartment" DROP CONSTRAINT "TrainRouteCompartment_trainRouteId_fkey";

-- AlterTable
ALTER TABLE "Train" ADD COLUMN     "trainRouteId" UUID;

-- DropTable
DROP TABLE "TrainRouteCompartment";

-- CreateTable
CREATE TABLE "TrainCompartment" (
    "id" UUID NOT NULL,
    "trainId" UUID NOT NULL,
    "compartmentId" UUID NOT NULL,

    CONSTRAINT "TrainCompartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainCompartment_trainId_compartmentId_key" ON "TrainCompartment"("trainId", "compartmentId");

-- AddForeignKey
ALTER TABLE "TrainCompartment" ADD CONSTRAINT "TrainCompartment_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainCompartment" ADD CONSTRAINT "TrainCompartment_compartmentId_fkey" FOREIGN KEY ("compartmentId") REFERENCES "Compartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Train" ADD CONSTRAINT "Train_trainRouteId_fkey" FOREIGN KEY ("trainRouteId") REFERENCES "TrainRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

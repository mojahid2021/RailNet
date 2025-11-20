/*
  Warnings:

  - You are about to drop the column `trainId` on the `routes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_trainId_fkey";

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "trainId";

-- AlterTable
ALTER TABLE "trains" ADD COLUMN     "routeId" TEXT;

-- AddForeignKey
ALTER TABLE "trains" ADD CONSTRAINT "trains_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `seats` to the `Compartment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Compartment" ADD COLUMN     "seats" INTEGER NOT NULL;

/*
  Warnings:

  - Added the required column `totalSeats` to the `coach_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coach_types" ADD COLUMN     "totalSeats" INTEGER;

-- Update existing rows with default values based on coach type names
UPDATE "coach_types" SET "totalSeats" = CASE
  WHEN "name" = 'Shovan' THEN 72
  WHEN "name" = 'Shovan Chair' THEN 78
  WHEN "name" = 'First Class Seat / Berth' THEN 24
  WHEN "name" = 'Snigdha' THEN 64
  WHEN "name" = 'AC Seat' THEN 72
  WHEN "name" = 'AC Berth' THEN 54
  WHEN "name" = 'AC Cabin' THEN 18
  ELSE 72 -- Default fallback
END;

-- Make the column NOT NULL after setting values
ALTER TABLE "coach_types" ALTER COLUMN "totalSeats" SET NOT NULL;

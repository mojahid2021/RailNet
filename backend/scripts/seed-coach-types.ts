/**
 * Seed script for coach types
 * Run this script to populate initial coach types in the database
 */

import { getPrismaClient } from '../src/core/database';
import { appLogger } from '../src/core/logger';

interface CoachTypeSeed {
  name: string;
  description?: string;
  totalSeats: number;
  ratePerKm: number;
}

const coachTypes: CoachTypeSeed[] = [
  {
    name: 'Shovan',
    description: 'Lowest cost general class',
    totalSeats: 72,
    ratePerKm: 0.5,
  },
  {
    name: 'Shovan Chair',
    description: 'Chair car in Shovan class',
    totalSeats: 78,
    ratePerKm: 0.75,
  },
  {
    name: 'First Class Seat / Berth',
    description: 'First class accommodation with seats and berths',
    totalSeats: 24,
    ratePerKm: 2.0,
  },
  {
    name: 'Snigdha',
    description: 'Premium non-AC class',
    totalSeats: 64,
    ratePerKm: 1.25,
  },
  {
    name: 'AC Seat',
    description: 'Air-conditioned seating',
    totalSeats: 72,
    ratePerKm: 1.5,
  },
  {
    name: 'AC Berth',
    description: 'Air-conditioned berth accommodation',
    totalSeats: 54,
    ratePerKm: 2.5,
  },
  {
    name: 'AC Cabin',
    description: 'Highest cost air-conditioned cabin',
    totalSeats: 18,
    ratePerKm: 3.0,
  },
];

async function seedCoachTypes(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    appLogger.info('Starting coach types seeding...');

    for (const coachType of coachTypes) {
      // Generate unique code
      const baseCode = coachType.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Ensure unique code
      while (await prisma.coachType.findUnique({ where: { code } })) {
        code = `${baseCode}${counter}`;
        counter++;
      }

      const existing = await prisma.coachType.findUnique({
        where: { name: coachType.name },
      });

      if (!existing) {
        await prisma.coachType.create({
          data: {
            name: coachType.name,
            code,
            description: coachType.description,
            totalSeats: coachType.totalSeats,
            ratePerKm: coachType.ratePerKm,
          },
        });
        appLogger.info(`Created coach type: ${coachType.name} (${code})`);
      } else {
        appLogger.info(`Coach type already exists: ${coachType.name}`);
      }
    }

    appLogger.info('Coach types seeding completed successfully');
  } catch (error) {
    appLogger.error('Coach types seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedCoachTypes()
    .then(() => {
      appLogger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      appLogger.error('Seed script failed', { error });
      process.exit(1);
    });
}

export { seedCoachTypes };
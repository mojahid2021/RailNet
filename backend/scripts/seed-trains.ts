/**
 * Seed script for trains
 * Run this script to populate initial trains in the database
 */

import { getPrismaClient } from '../src/core/database';
import { appLogger } from '../src/core/logger';

interface TrainSeed {
  name: string;
  number: string;
  type: 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'PASSENGER' | 'SHATABDI' | 'RAJDHANI';
  routeName: string;
  coaches: Array<{
    coachTypeCode: string;
    count: number;
  }>;
}

const trains: TrainSeed[] = [
  {
    name: 'Delhi Mumbai Express',
    number: '12951',
    type: 'SUPERFAST',
    routeName: 'Delhi to Mumbai Express Route',
    coaches: [
      { coachTypeCode: 'ACBERT', count: 2 },
      { coachTypeCode: 'ACSEAT', count: 3 },
      { coachTypeCode: 'SNIGDH', count: 4 },
      { coachTypeCode: 'SHOVAN', count: 6 },
    ],
  },
  {
    name: 'Delhi Kolkata Express',
    number: '12301',
    type: 'RAJDHANI',
    routeName: 'Delhi to Kolkata Express Route',
    coaches: [
      { coachTypeCode: 'ACCABI', count: 3 },
      { coachTypeCode: 'ACBERT', count: 4 },
      { coachTypeCode: 'FIRSTC', count: 2 },
    ],
  },
  {
    name: 'Mumbai Delhi Mail',
    number: '11057',
    type: 'MAIL',
    routeName: 'Delhi to Mumbai Express Route',
    coaches: [
      { coachTypeCode: 'SNIGDH', count: 5 },
      { coachTypeCode: 'SHOVAN', count: 8 },
    ],
  },
  {
    name: 'Kolkata Delhi Express',
    number: '12302',
    type: 'RAJDHANI',
    routeName: 'Delhi to Kolkata Express Route',
    coaches: [
      { coachTypeCode: 'ACCABI', count: 3 },
      { coachTypeCode: 'ACBERT', count: 4 },
      { coachTypeCode: 'FIRSTC', count: 2 },
    ],
  },
  {
    name: 'Delhi Mumbai Shatabdi',
    number: '12001',
    type: 'SHATABDI',
    routeName: 'Delhi to Mumbai Express Route',
    coaches: [
      { coachTypeCode: 'ACSEAT', count: 6 },
    ],
  },
];

async function seedTrains(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    appLogger.info('Starting trains seeding...');

    // Get all routes to map by name
    const routes = await prisma.route.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const routeMap = new Map(routes.map(route => [route.name, route.id]));

    // Get all coach types to map by code
    const coachTypes = await prisma.coachType.findMany({
      select: {
        id: true,
        code: true,
        totalSeats: true,
      },
    });

    const coachTypeMap = new Map(coachTypes.map(ct => [ct.code, { id: ct.id, totalSeats: ct.totalSeats }]));

    // Seed trains
    for (const train of trains) {
      const routeId = routeMap.get(train.routeName);

      if (!routeId) {
        appLogger.warn(`Route not found for train ${train.name}: ${train.routeName}`);
        continue;
      }

      const existing = await prisma.train.findUnique({
        where: { number: train.number },
      });

      if (!existing) {
        // Calculate total seats and prepare coach data
        let totalSeats = 0;
        const coachCreations: Array<{
          coachTypeId: string;
          coachNumber: string;
          totalSeats: number;
        }> = [];

        for (const coach of train.coaches) {
          const coachType = coachTypeMap.get(coach.coachTypeCode);
          if (!coachType) {
            throw new Error(`Coach type ${coach.coachTypeCode} not found`);
          }

          for (let i = 1; i <= coach.count; i++) {
            const coachNumber = `${coach.coachTypeCode}${String(i).padStart(2, '0')}`;
            coachCreations.push({
              coachTypeId: coachType.id,
              coachNumber,
              totalSeats: coachType.totalSeats,
            });
            totalSeats += coachType.totalSeats;
          }
        }

        // Create train
        const createdTrain = await prisma.train.create({
          data: {
            name: train.name,
            number: train.number,
            type: train.type,
            routeId,
            totalSeats,
            isActive: true,
          },
        });

        // Create coaches
        for (const coachData of coachCreations) {
          await prisma.coach.create({
            data: {
              trainId: createdTrain.id,
              coachTypeId: coachData.coachTypeId,
              coachNumber: coachData.coachNumber,
              totalSeats: coachData.totalSeats,
            },
          });
        }

        appLogger.info(`Created train: ${train.name} (${train.number}) with ${coachCreations.length} coaches, total seats: ${totalSeats}`);
      } else {
        appLogger.info(`Train already exists: ${train.name} (${train.number})`);
      }
    }

    appLogger.info('Trains seeding completed successfully');
  } catch (error) {
    appLogger.error('Trains seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedTrains()
    .then(() => {
      appLogger.info('Train seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Train seed script failed with error:', error);
      appLogger.error('Train seed script failed', { error });
      process.exit(1);
    });
}

export { seedTrains };
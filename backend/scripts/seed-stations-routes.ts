/**
 * Seed script for stations and routes
 * Run this script to populate initial stations and routes in the database
 */

import { getPrismaClient } from '../src/core/database';
import { appLogger } from '../src/core/logger';

interface StationSeed {
  name: string;
  code: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface RouteSeed {
  name: string;
  distance: number;
  duration: number;
  stops: Array<{
    stationCode: string;
    stopOrder: number;
    arrivalTime?: string;
    departureTime?: string;
    distanceFromStart: number;
    platform?: string;
  }>;
}

const stations: StationSeed[] = [
  {
    name: 'New Delhi Railway Station',
    code: 'NDLS',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6415,
    longitude: 77.2194,
  },
  {
    name: 'Mumbai Central',
    code: 'MMCT',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 18.9690,
    longitude: 72.8205,
  },
  {
    name: 'Howrah Junction',
    code: 'HWH',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5822,
    longitude: 88.3378,
  },
  {
    name: 'Chennai Central',
    code: 'MAS',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    name: 'Bangalore City',
    code: 'SBC',
    city: 'Bangalore',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
  },
];

const routes: RouteSeed[] = [
  {
    name: 'Delhi to Mumbai Express Route',
    distance: 1384,
    duration: 960, // 16 hours in minutes
    stops: [
      {
        stationCode: 'NDLS',
        stopOrder: 1,
        departureTime: '08:00',
        distanceFromStart: 0,
        platform: '1',
      },
      {
        stationCode: 'MMCT',
        stopOrder: 2,
        arrivalTime: '00:00',
        distanceFromStart: 1384,
        platform: '2',
      },
    ],
  },
  {
    name: 'Delhi to Kolkata Express Route',
    distance: 1472,
    duration: 1020, // 17 hours in minutes
    stops: [
      {
        stationCode: 'NDLS',
        stopOrder: 1,
        departureTime: '14:00',
        distanceFromStart: 0,
        platform: '3',
      },
      {
        stationCode: 'HWH',
        stopOrder: 2,
        arrivalTime: '07:00',
        distanceFromStart: 1472,
        platform: '1',
      },
    ],
  },
];

async function seedStationsAndRoutes(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    appLogger.info('Starting stations and routes seeding...');

    // Seed stations
    const stationMap = new Map<string, string>();
    for (const station of stations) {
      const existing = await prisma.station.findUnique({
        where: { code: station.code },
      });

      if (!existing) {
        const created = await prisma.station.create({
          data: {
            name: station.name,
            code: station.code,
            city: station.city,
            state: station.state,
            latitude: station.latitude,
            longitude: station.longitude,
          },
        });
        stationMap.set(station.code, created.id);
        appLogger.info(`Created station: ${station.name} (${station.code})`);
      } else {
        stationMap.set(station.code, existing.id);
        appLogger.info(`Station already exists: ${station.name}`);
      }
    }

    // Seed routes
    for (const route of routes) {
      const baseCode = route.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Ensure unique code
      while (await prisma.route.findUnique({ where: { code } })) {
        code = `${baseCode}${counter}`;
        counter++;
      }

      const existing = await prisma.route.findFirst({
        where: { name: route.name },
      });

      if (!existing) {
        const created = await prisma.route.create({
          data: {
            name: route.name,
            code,
            distance: route.distance,
            duration: route.duration,
          },
        });

        // Create route stops
        for (const stop of route.stops) {
          const stationId = stationMap.get(stop.stationCode);
          if (!stationId) {
            throw new Error(`Station ${stop.stationCode} not found`);
          }

          await prisma.routeStop.create({
            data: {
              routeId: created.id,
              stationId,
              stopOrder: stop.stopOrder,
              arrivalTime: stop.arrivalTime,
              departureTime: stop.departureTime,
              distanceFromStart: stop.distanceFromStart,
              platform: stop.platform,
            },
          });
        }

        appLogger.info(`Created route: ${route.name} (${code})`);
      } else {
        appLogger.info(`Route already exists: ${route.name}`);
      }
    }

    appLogger.info('Stations and routes seeding completed successfully');
  } catch (error) {
    appLogger.error('Stations and routes seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedStationsAndRoutes()
    .then(() => {
      appLogger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      appLogger.error('Seed script failed', { error });
      process.exit(1);
    });
}

export { seedStationsAndRoutes };
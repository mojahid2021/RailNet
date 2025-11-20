"use strict";
/**
 * Seed script for coach types
 * Run this script to populate initial coach types in the database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCoachTypes = seedCoachTypes;
const database_1 = require("../src/core/database");
const logger_1 = require("../src/core/logger");
const coachTypes = [
    {
        name: 'Shovan',
        description: 'Lowest cost general class',
        ratePerKm: 0.5,
    },
    {
        name: 'Shovan Chair',
        description: 'Chair car in Shovan class',
        ratePerKm: 0.75,
    },
    {
        name: 'First Class Seat / Berth',
        description: 'First class accommodation with seats and berths',
        ratePerKm: 2.0,
    },
    {
        name: 'Snigdha',
        description: 'Premium non-AC class',
        ratePerKm: 1.25,
    },
    {
        name: 'AC Seat',
        description: 'Air-conditioned seating',
        ratePerKm: 1.5,
    },
    {
        name: 'AC Berth',
        description: 'Air-conditioned berth accommodation',
        ratePerKm: 2.5,
    },
    {
        name: 'AC Cabin',
        description: 'Highest cost air-conditioned cabin',
        ratePerKm: 3.0,
    },
];
async function seedCoachTypes() {
    const prisma = (0, database_1.getPrismaClient)();
    try {
        logger_1.appLogger.info('Starting coach types seeding...');
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
                        ratePerKm: coachType.ratePerKm,
                    },
                });
                logger_1.appLogger.info(`Created coach type: ${coachType.name} (${code})`);
            }
            else {
                logger_1.appLogger.info(`Coach type already exists: ${coachType.name}`);
            }
        }
        logger_1.appLogger.info('Coach types seeding completed successfully');
    }
    catch (error) {
        logger_1.appLogger.error('Coach types seeding failed', { error });
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the seed function
if (require.main === module) {
    seedCoachTypes()
        .then(() => {
        logger_1.appLogger.info('Seed script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.appLogger.error('Seed script failed', { error });
        process.exit(1);
    });
}

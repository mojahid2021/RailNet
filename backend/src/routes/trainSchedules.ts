import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { errorResponseSchema, trainScheduleWithTimestampsSchema, createTrainScheduleBodySchema } from '../schemas/index.js';

const prisma = new PrismaClient();

export default async function trainScheduleRoutes(fastify: FastifyInstance) {
  // Create train schedule - Admin only
  fastify.post('/train-schedules', {
    preHandler: (fastify as any).requireAdmin,
    schema: {
      description: 'Create a new train schedule (Admin only)',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      body: createTrainScheduleBodySchema,
      response: {
        201: trainScheduleWithTimestampsSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { trainId, date, time } = request.body as {
      trainId: number;
      date: string;
      time: string;
    };

    // Validate train exists and get route stations
    const train = await prisma.train.findUnique({
      where: { id: trainId },
      include: {
        trainRoute: {
          include: {
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
      },
    });

    if (!train) {
      return reply.code(400).send({ error: 'Train not found' });
    }

    // Parse date and create DateTime
    const scheduleDate = new Date(date);
    if (isNaN(scheduleDate.getTime())) {
      return reply.code(400).send({ error: 'Invalid date format' });
    }

    // Set the time on the date
    const [hours, minutes] = time.split(':').map(Number);
    scheduleDate.setHours(hours, minutes, 0, 0);

    try {
      // Create the train schedule
      const trainSchedule = await prisma.trainSchedule.create({
        data: {
          trainId,
          trainRouteId: train.trainRouteId,
          date: scheduleDate,
          time,
        },
      });

      // Create ScheduleStation records for each route station
      const scheduleStations = [];
      let currentTime = new Date(scheduleDate);

      for (let i = 0; i < train.trainRoute.routeStations.length; i++) {
        const routeStation = train.trainRoute.routeStations[i];

        // Calculate arrival time (assume 1 minute per km for simplicity)
        const travelMinutes = routeStation.distanceFromStart;
        const arrivalTime = new Date(currentTime.getTime() + travelMinutes * 60 * 1000);

        // Departure time is 5 minutes after arrival (stop time)
        const departureTime = new Date(arrivalTime.getTime() + 5 * 60 * 1000);

        const scheduleStation = await prisma.scheduleStation.create({
          data: {
            trainScheduleId: trainSchedule.id,
            stationId: routeStation.currentStationId,
            arrivalTime: arrivalTime.toISOString(),
            departureTime: departureTime.toISOString(),
            sequence: i + 1, // Sequence starts from 1
          },
          include: {
            station: true,
          },
        });

        scheduleStations.push(scheduleStation);
        currentTime = departureTime; // Next station starts from this departure time
      }

      // Return the complete schedule with station times
      const completeSchedule = await prisma.trainSchedule.findUnique({
        where: { id: trainSchedule.id },
        include: {
          train: {
            include: {
              trainRoute: {
                include: {
                  startStation: true,
                  endStation: true,
                  routeStations: {
                    include: {
                      currentStation: true,
                    },
                    orderBy: { distanceFromStart: 'asc' },
                  },
                },
              },
              compartments: {
                include: {
                  compartment: true,
                },
              },
            },
          },
          trainRoute: {
            include: {
              startStation: true,
              endStation: true,
              routeStations: {
                include: {
                  currentStation: true,
                },
                orderBy: { distanceFromStart: 'asc' },
              },
            },
          },
          stationTimes: {
            include: {
              station: true,
            },
            orderBy: { sequence: 'asc' },
          },
        },
      });

      reply.code(201).send(completeSchedule);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Schedule already exists for this train on this date' });
      }
      throw error;
    }
  });

  // Get all train schedules - Authenticated users
  fastify.get('/train-schedules', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get all train schedules',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: trainScheduleWithTimestampsSchema,
        },
      },
    },
  }, async (request, reply) => {
    const trainSchedules = await prisma.trainSchedule.findMany({
      include: {
        train: {
          include: {
            trainRoute: {
              include: {
                startStation: true,
                endStation: true,
                routeStations: {
                  include: {
                    currentStation: true,
                  },
                  orderBy: { distanceFromStart: 'asc' },
                },
              },
            },
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        },
        trainRoute: {
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
        stationTimes: {
          include: {
            station: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    reply.send(trainSchedules);
  });

  // Get train schedule by ID - Authenticated users
  fastify.get('/train-schedules/:id', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get a train schedule by ID',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: trainScheduleWithTimestampsSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return reply.code(400).send({ error: 'Invalid schedule ID' });
    }

    const trainSchedule = await prisma.trainSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        train: {
          include: {
            trainRoute: {
              include: {
                startStation: true,
                endStation: true,
                routeStations: {
                  include: {
                    currentStation: true,
                  },
                  orderBy: { distanceFromStart: 'asc' },
                },
              },
            },
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        },
        trainRoute: {
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
        stationTimes: {
          include: {
            station: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!trainSchedule) {
      return reply.code(404).send({ error: 'Train schedule not found' });
    }

    reply.send(trainSchedule);
  });

  // Get schedules by date - Authenticated users
  fastify.get('/train-schedules/date/:date', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get train schedules for a specific date',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: trainScheduleWithTimestampsSchema,
        },
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { date } = request.params as { date: string };

    // Validate date format
    const queryDate = new Date(date);
    if (isNaN(queryDate.getTime())) {
      return reply.code(400).send({ error: 'Invalid date format' });
    }

    // Get start and end of the day
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const trainSchedules = await prisma.trainSchedule.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        train: {
          include: {
            trainRoute: {
              include: {
                startStation: true,
                endStation: true,
                routeStations: {
                  include: {
                    currentStation: true,
                  },
                  orderBy: { distanceFromStart: 'asc' },
                },
              },
            },
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        },
        trainRoute: {
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
        stationTimes: {
          include: {
            station: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { time: 'asc' },
    });

    reply.send(trainSchedules);
  });

  // Get schedules by route ID - Authenticated users
  fastify.get('/train-schedules/route/:routeId', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get train schedules for a specific route',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          routeId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: trainScheduleWithTimestampsSchema,
        },
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { routeId } = request.params as { routeId: string };
    const routeIdNum = parseInt(routeId);

    if (isNaN(routeIdNum)) {
      return reply.code(400).send({ error: 'Invalid route ID' });
    }

    const trainSchedules = await prisma.trainSchedule.findMany({
      where: {
        trainRouteId: routeIdNum,
      },
      include: {
        train: {
          include: {
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        },
        trainRoute: {
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
        stationTimes: {
          include: {
            station: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    reply.send(trainSchedules);
  });

  // Search trains by stations and date - Authenticated users
  fastify.get('/train-schedules/search', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Search trains between two stations on a specific date',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['fromStationId', 'toStationId', 'date'],
        properties: {
          fromStationId: { type: 'string' },
          toStationId: { type: 'string' },
          date: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: trainScheduleWithTimestampsSchema,
        },
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { fromStationId, toStationId, date } = request.query as {
      fromStationId: string;
      toStationId: string;
      date: string;
    };

    const fromStationIdNum = parseInt(fromStationId);
    const toStationIdNum = parseInt(toStationId);

    if (isNaN(fromStationIdNum) || isNaN(toStationIdNum)) {
      return reply.code(400).send({ error: 'Invalid station IDs' });
    }

    if (fromStationIdNum === toStationIdNum) {
      return reply.code(400).send({ error: 'From and to stations cannot be the same' });
    }

    // Validate date format
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return reply.code(400).send({ error: 'Invalid date format' });
    }

    // Get start and end of the day
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find routes that contain both stations with correct order
    const validRoutes = await prisma.trainRoute.findMany({
      where: {
        AND: [
          {
            routeStations: {
              some: {
                currentStationId: fromStationIdNum,
              },
            },
          },
          {
            routeStations: {
              some: {
                currentStationId: toStationIdNum,
              },
            },
          },
        ],
      },
      include: {
        routeStations: {
          include: {
            currentStation: true,
          },
          orderBy: { distanceFromStart: 'asc' },
        },
      },
    });

    // Filter routes where from station comes before to station
    const filteredRoutes = validRoutes.filter(route => {
      const fromStation = route.routeStations.find(rs => rs.currentStationId === fromStationIdNum);
      const toStation = route.routeStations.find(rs => rs.currentStationId === toStationIdNum);

      if (!fromStation || !toStation) return false;

      return toStation.distanceFromStart > fromStation.distanceFromStart;
    });

    if (filteredRoutes.length === 0) {
      return reply.send([]); // No routes found between these stations
    }

    const routeIds = filteredRoutes.map(route => route.id);

    // Find schedules for these routes on the given date
    const trainSchedules = await prisma.trainSchedule.findMany({
      where: {
        AND: [
          {
            trainRouteId: {
              in: routeIds,
            },
          },
          {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
      include: {
        train: {
          include: {
            trainRoute: {
              include: {
                startStation: true,
                endStation: true,
                routeStations: {
                  include: {
                    currentStation: true,
                  },
                  orderBy: { distanceFromStart: 'asc' },
                },
              },
            },
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        },
        trainRoute: {
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              include: {
                currentStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
        stationTimes: {
          include: {
            station: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    reply.send(trainSchedules);
  });
}
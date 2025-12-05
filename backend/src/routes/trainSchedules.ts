import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { errorResponseSchema, trainScheduleWithTimestampsSchema, createTrainScheduleBodySchema, trainSchedulesListResponseSchema } from '../schemas/index.js';

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
    const { trainId, date, time, stationTimes } = request.body as {
      trainId: number;
      date: string;
      time: string;
      stationTimes: Array<{
        stationId: number;
        arrivalTime: string;
        departureTime: string;
      }>;
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

    // Validate that provided stationTimes match route stations
    const routeStationIds = train.trainRoute.routeStations.map(rs => rs.currentStationId);
    const providedStationIds = stationTimes.map(st => st.stationId);

    if (routeStationIds.length !== providedStationIds.length ||
        !routeStationIds.every(id => providedStationIds.includes(id))) {
      return reply.code(400).send({ error: 'Station times must be provided for all stations in the route' });
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

      // Create ScheduleStation records using provided times
      const scheduleStations = [];

      for (let i = 0; i < stationTimes.length; i++) {
        const stationTime = stationTimes[i];
        const routeStation = train.trainRoute.routeStations.find(rs => rs.currentStationId === stationTime.stationId);

        if (!routeStation) {
          return reply.code(400).send({ error: `Station ${stationTime.stationId} not found in route` });
        }

        // Parse arrival and departure times for the schedule date
        const [arrHours, arrMinutes] = stationTime.arrivalTime.split(':').map(Number);
        const [depHours, depMinutes] = stationTime.departureTime.split(':').map(Number);

        const arrivalDateTime = new Date(scheduleDate);
        arrivalDateTime.setHours(arrHours, arrMinutes, 0, 0);

        const departureDateTime = new Date(scheduleDate);
        departureDateTime.setHours(depHours, depMinutes, 0, 0);

        const scheduleStation = await prisma.scheduleStation.create({
          data: {
            trainScheduleId: trainSchedule.id,
            stationId: stationTime.stationId,
            arrivalTime: arrivalDateTime.toISOString(),
            departureTime: departureDateTime.toISOString(),
            sequence: i + 1, // Sequence based on provided order
          },
          include: {
            station: true,
          },
        });

        scheduleStations.push(scheduleStation);
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
        200: trainSchedulesListResponseSchema,
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

  // Get seat availability for a train schedule - Authenticated users
  fastify.get('/train-schedules/:id/seats', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get seat availability for a specific train schedule',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            scheduleId: { type: 'number' },
            trainName: { type: 'string' },
            trainNumber: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' },
            compartments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  compartmentId: { type: 'number' },
                  compartmentName: { type: 'string' },
                  class: { type: 'string' },
                  type: { type: 'string' },
                  totalSeats: { type: 'number' },
                  availableSeats: { type: 'number' },
                  seats: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        seatId: { type: 'number' },
                        seatNumber: { type: 'string' },
                        isAvailable: { type: 'boolean' },
                        passengerName: { type: 'string' },
                        passengerAge: { type: 'number' },
                        passengerGender: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return reply.code(400).send({ error: 'Invalid schedule ID' });
    }

    // Get train schedule with train and compartments
    const trainSchedule = await prisma.trainSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        train: {
          include: {
            compartments: {
              include: {
                compartment: true,
                seats: {
                  include: {
                    ticket: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!trainSchedule) {
      return reply.code(404).send({ error: 'Train schedule not found' });
    }

    // Get compartment booking data for fast availability checking
    const compartmentBookings = await prisma.compartmentBooking.findMany({
      where: {
        trainScheduleId: scheduleId,
      },
    });

    // Create a map for quick lookup
    const bookingMap = new Map<number, typeof compartmentBookings[0]>();
    compartmentBookings.forEach(booking => {
      bookingMap.set(booking.trainCompartmentId, booking);
    });

    // Build response with seat availability
    const compartments = trainSchedule.train.compartments.map((trainComp) => {
      const existingSeats = trainComp.seats;
      const booking = bookingMap.get(trainComp.id);
      const bookedCount = booking?.bookedSeats || 0;
      const availableCount = Math.max(0, trainComp.compartment.totalSeats - bookedCount);

      // Generate seats list from existing records plus available slots
      const seats = [];

      // Add existing seats
      existingSeats.forEach(seat => {
        seats.push({
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          isAvailable: seat.isAvailable,
          passengerName: seat.ticket?.passengerName || null,
          passengerAge: seat.ticket?.passengerAge || null,
          passengerGender: seat.ticket?.passengerGender || null,
        });
      });

      // Add available slots
      for (let i = 0; i < availableCount; i++) {
        seats.push({
          seatId: null,
          seatNumber: `Seat-${bookedCount + i + 1}`,
          isAvailable: true,
          passengerName: null,
          passengerAge: null,
          passengerGender: null,
        });
      }

      const availableSeats = seats.filter(seat => seat.isAvailable).length;

      return {
        compartmentId: trainComp.compartmentId,
        compartmentName: trainComp.compartment.name,
        class: trainComp.compartment.class,
        type: trainComp.compartment.type,
        totalSeats: trainComp.compartment.totalSeats,
        availableSeats,
        seats,
      };
    });

    const response = {
      scheduleId: trainSchedule.id,
      trainName: trainSchedule.train.name,
      trainNumber: trainSchedule.train.number,
      date: trainSchedule.date.toISOString().split('T')[0],
      time: trainSchedule.time,
      compartments,
    };

    reply.send(response);
  });

  // Get available seats for a journey segment within a schedule - Authenticated users
  fastify.get('/train-schedules/:id/available-seats', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get available seats for a specific journey segment within a train schedule',
      tags: ['Train Schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          fromStationId: { type: 'number' },
          toStationId: { type: 'number' },
        },
        required: ['fromStationId', 'toStationId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            scheduleId: { type: 'number' },
            trainName: { type: 'string' },
            trainNumber: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' },
            journeySegment: {
              type: 'object',
              properties: {
                fromStation: { type: 'string' },
                toStation: { type: 'string' },
              },
            },
            compartments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  compartmentId: { type: 'number' },
                  compartmentName: { type: 'string' },
                  class: { type: 'string' },
                  type: { type: 'string' },
                  price: { type: 'number' },
                  totalSeats: { type: 'number' },
                  bookedSeats: { type: 'number' },
                  availableSeats: { type: 'number' },
                },
              },
            },
          },
        },
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { fromStationId, toStationId } = request.query as { fromStationId: number; toStationId: number };
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return reply.code(400).send({ error: 'Invalid schedule ID' });
    }

    // Get train schedule with route validation
    const trainSchedule = await prisma.trainSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        train: {
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
            compartments: {
              include: {
                compartment: true,
                seats: true, // Get all seats, we'll filter by availability
              },
            },
          },
        },
      },
    });

    if (!trainSchedule) {
      return reply.code(404).send({ error: 'Train schedule not found' });
    }

    // Validate journey segment is valid for this route
    const fromStationInRoute = trainSchedule.train.trainRoute.routeStations.find(rs => rs.currentStationId === fromStationId);
    const toStationInRoute = trainSchedule.train.trainRoute.routeStations.find(rs => rs.currentStationId === toStationId);

    if (!fromStationInRoute || !toStationInRoute) {
      return reply.code(400).send({ error: 'Invalid from or to station for this route' });
    }

    if (toStationInRoute.distanceFromStart <= fromStationInRoute.distanceFromStart) {
      return reply.code(400).send({ error: 'To station must come after from station in the route' });
    }

    // Get compartment booking data for fast availability checking
    const compartmentBookings = await prisma.compartmentBooking.findMany({
      where: {
        trainScheduleId: scheduleId,
      },
      include: {
        trainCompartment: {
          include: {
            compartment: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const bookingMap = new Map<number, typeof compartmentBookings[0]>();
    compartmentBookings.forEach(booking => {
      bookingMap.set(booking.trainCompartmentId, booking);
    });

    // Build response with available seats for the journey segment
    const compartments = trainSchedule.train.compartments.map((trainComp) => {
      const booking = bookingMap.get(trainComp.id);
      const bookedCount = booking?.bookedSeats || 0;
      const availableCount = Math.max(0, trainComp.compartment.totalSeats - bookedCount);

      return {
        compartmentId: trainComp.compartmentId,
        compartmentName: trainComp.compartment.name,
        class: trainComp.compartment.class,
        type: trainComp.compartment.type,
        price: trainComp.compartment.price,
        totalSeats: trainComp.compartment.totalSeats,
        bookedSeats: bookedCount,
        availableSeats: availableCount,
      };
    });

    const response = {
      scheduleId: trainSchedule.id,
      trainName: trainSchedule.train.name,
      trainNumber: trainSchedule.train.number,
      date: trainSchedule.date.toISOString().split('T')[0],
      time: trainSchedule.time,
      journeySegment: {
        fromStation: fromStationInRoute.currentStation.name,
        toStation: toStationInRoute.currentStation.name,
      },
      compartments,
    };

    reply.send(response);
  });
}
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { errorResponseSchema, ticketWithTimestampsSchema, bookTicketBodySchema } from '../schemas/index.js';

const prisma = new PrismaClient();

export default async function ticketRoutes(fastify: FastifyInstance) {
  // Book a ticket - Authenticated users
  fastify.post('/tickets', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Book a train ticket',
      tags: ['Tickets'],
      security: [{ bearerAuth: [] }],
      body: bookTicketBodySchema,
      response: {
        201: ticketWithTimestampsSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { trainScheduleId, fromStationId, toStationId, compartmentId, seatNumber, passengerName, passengerAge, passengerGender } = request.body as {
      trainScheduleId: number;
      fromStationId: number;
      toStationId: number;
      compartmentId: number;
      seatNumber: string;
      passengerName: string;
      passengerAge: number;
      passengerGender: string;
    };

    const userId = (request.user as { id: number }).id;

    // Validate train schedule exists and get related data
    const trainSchedule = await prisma.trainSchedule.findUnique({
      where: { id: trainScheduleId },
      include: {
        train: {
          include: {
            compartments: {
              where: { compartmentId },
              include: {
                compartment: true,
              },
            },
          },
        },
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

    // Validate from and to stations are in the route and in correct order
    const fromStationInRoute = trainSchedule.trainRoute.routeStations.find(rs => rs.currentStationId === fromStationId);
    const toStationInRoute = trainSchedule.trainRoute.routeStations.find(rs => rs.currentStationId === toStationId);

    if (!fromStationInRoute || !toStationInRoute) {
      return reply.code(400).send({ error: 'Invalid from or to station for this route' });
    }

    if (toStationInRoute.distanceFromStart <= fromStationInRoute.distanceFromStart) {
      return reply.code(400).send({ error: 'To station must come after from station in the route' });
    }

    // Validate compartment is available for this train
    const trainCompartment = trainSchedule.train.compartments[0];
    if (!trainCompartment) {
      return reply.code(400).send({ error: 'Compartment not available for this train' });
    }

    // Check if seat number is already booked for this train compartment on this date
    const existingBooking = await prisma.ticket.findFirst({
      where: {
        trainSchedule: {
          trainId: trainSchedule.trainId,
          date: trainSchedule.date,
        },
        trainCompartmentId: trainCompartment.id,
        seatNumber,
        status: 'booked',
      },
    });

    if (existingBooking) {
      return reply.code(409).send({ error: 'Seat number already booked for this train and date' });
    }

    // Check total booked seats for this train compartment on this date
    const totalBookedSeats = await prisma.ticket.count({
      where: {
        trainSchedule: {
          trainId: trainSchedule.trainId,
          date: trainSchedule.date,
        },
        trainCompartmentId: trainCompartment.id,
        status: 'booked',
      },
    });

    if (totalBookedSeats >= trainCompartment.compartment.totalSeats) {
      return reply.code(409).send({ error: 'No seats available in this compartment for this train and date' });
    }

    // Create the seat record
    const seat = await prisma.seat.create({
      data: {
        trainCompartmentId: trainCompartment.id,
        seatNumber,
        seatType: 'Standard', // Simplified seat type
        row: 1,
        column: 'A',
        isAvailable: false,
      },
    });

    // Calculate price (could be enhanced with distance-based pricing)
    const price = trainCompartment.compartment.price;

    // Use a transaction to ensure atomicity
    try {
      const ticket = await prisma.$transaction(async (tx) => {
        // Create the ticket (seat is already created and marked as unavailable)
        return await tx.ticket.create({
          data: {
            userId,
            trainScheduleId,
            fromStationId,
            toStationId,
            seatId: seat.id,
            trainCompartmentId: seat.trainCompartmentId,
            seatNumber: seat.seatNumber,
            passengerName,
            passengerAge,
            passengerGender,
            price,
          },
          include: {
            user: true,
            trainSchedule: {
              include: {
                train: {
                  include: {
                    trainRoute: {
                      include: {
                        startStation: true,
                        endStation: true,
                      },
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
            },
            fromStation: true,
            toStation: true,
            trainCompartment: {
              include: {
                compartment: true,
              },
            },
            seat: {
              include: {
                trainCompartment: {
                  include: {
                    compartment: true,
                  },
                },
              },
            },
          },
        });
      });

      reply.code(201).send(ticket);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Seat already booked' });
      }
      throw error;
    }
  });

  // Get user's tickets - Authenticated users
  fastify.get('/tickets', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get current user tickets',
      tags: ['Tickets'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: ticketWithTimestampsSchema,
        },
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as { id: number }).id;

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        user: true,
        trainSchedule: {
          include: {
            train: {
              include: {
                trainRoute: {
                  include: {
                    startStation: true,
                    endStation: true,
                  },
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
        },
        fromStation: true,
        toStation: true,
        seat: {
          include: {
            trainCompartment: {
              include: {
                compartment: true,
              },
            },
          },
        },
      },
      orderBy: [
        { bookedAt: 'desc' },
      ],
    });

    reply.send(tickets);
  });

  // Get ticket by ID - Authenticated users (only own tickets)
  fastify.get('/tickets/:id', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get ticket by ID',
      tags: ['Tickets'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: ticketWithTimestampsSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticketId = parseInt(id);
    const userId = (request.user as { id: number }).id;

    if (isNaN(ticketId)) {
      return reply.code(400).send({ error: 'Invalid ticket ID' });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId, // Only allow users to see their own tickets
      },
      include: {
        user: true,
        trainSchedule: {
          include: {
            train: {
              include: {
                trainRoute: {
                  include: {
                    startStation: true,
                    endStation: true,
                  },
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
        },
        fromStation: true,
        toStation: true,
        seat: {
          include: {
            trainCompartment: {
              include: {
                compartment: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }

    reply.send(ticket);
  });

  // Cancel ticket - Authenticated users (only own tickets)
  fastify.put('/tickets/:id/cancel', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Cancel a ticket',
      tags: ['Tickets'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: ticketWithTimestampsSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticketId = parseInt(id);
    const userId = (request.user as { id: number }).id;

    if (isNaN(ticketId)) {
      return reply.code(400).send({ error: 'Invalid ticket ID' });
    }

    // Check if ticket exists and belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId,
      },
    });

    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }

    if (ticket.status === 'cancelled') {
      return reply.code(400).send({ error: 'Ticket is already cancelled' });
    }

    // Check if ticket can be cancelled (e.g., not too close to departure)
    const trainSchedule = await prisma.trainSchedule.findUnique({
      where: { id: ticket.trainScheduleId },
    });

    if (!trainSchedule) {
      return reply.code(404).send({ error: 'Train schedule not found' });
    }

    // Simple check: don't allow cancellation within 2 hours of departure
    const departureTime = new Date(trainSchedule.date);
    const [hours, minutes] = trainSchedule.time.split(':').map(Number);
    departureTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      return reply.code(400).send({ error: 'Cannot cancel ticket within 2 hours of departure' });
    }

    // Update ticket status to cancelled and make seat available again
    const updatedTicket = await prisma.$transaction(async (tx) => {
      // Mark seat as available
      await tx.seat.update({
        where: { id: ticket.seatId },
        data: { isAvailable: true },
      });

      // Update ticket status
      return await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'cancelled' },
        include: {
          user: true,
          trainSchedule: {
            include: {
              train: {
                include: {
                  trainRoute: {
                    include: {
                      startStation: true,
                      endStation: true,
                    },
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
          },
          fromStation: true,
          toStation: true,
          seat: {
            include: {
              trainCompartment: {
                include: {
                  compartment: true,
                },
              },
            },
          },
        },
      });
    });

    reply.send(updatedTicket);
  });
}
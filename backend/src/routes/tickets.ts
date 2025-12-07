import { FastifyInstance } from 'fastify';
import { addMinutes } from 'date-fns';
import prisma from '../lib/prisma';
import {
  errorResponseSchema,
  ticketWithTimestampsSchema,
  ticketBookingResponseSchema,
  bookTicketBodySchema,
  ticketsListResponseSchema,
} from '../schemas/index.js';

// Generate a unique ticket ID
function generateTicketId(trainName: string, date: Date, seatNumber: string): string {
  // Clean train name (remove spaces, special chars, take first 3-4 chars)
  const cleanTrainName = trainName
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();

  // Format date as YYYYMMDD
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Clean seat number
  const cleanSeatNumber = seatNumber.replace(/[^A-Za-z0-9]/g, '');

  // Generate a random 3-digit suffix for uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${cleanTrainName}-${dateStr}-${cleanSeatNumber}-${randomSuffix}`;
}

export default async function ticketRoutes(fastify: FastifyInstance) {
  // Book a ticket - Authenticated users
  fastify.post(
    '/tickets',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Book a train ticket',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        body: bookTicketBodySchema,
        response: {
          201: ticketBookingResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const {
        trainScheduleId,
        fromStationId,
        toStationId,
        compartmentId,
        seatNumber,
        passengerName,
        passengerAge,
        passengerGender,
      } = request.body as {
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
      const fromStationInRoute = trainSchedule.trainRoute.routeStations.find(
        (rs) => rs.currentStationId === fromStationId,
      );
      const toStationInRoute = trainSchedule.trainRoute.routeStations.find(
        (rs) => rs.currentStationId === toStationId,
      );

      if (!fromStationInRoute || !toStationInRoute) {
        return reply.code(400).send({ error: 'Invalid from or to station for this route' });
      }

      if (toStationInRoute.distanceFromStart <= fromStationInRoute.distanceFromStart) {
        return reply
          .code(400)
          .send({ error: 'To station must come after from station in the route' });
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
          status: {
            in: ['booked', 'confirmed'], // Include confirmed tickets as well
          },
        },
      });

      if (existingBooking) {
        return reply
          .code(409)
          .send({ error: 'Seat number already booked for this train and date' });
      }

      // Get or create compartment booking record for faster availability checking
      let compartmentBooking = await prisma.compartmentBooking.findUnique({
        where: {
          trainScheduleId_trainCompartmentId: {
            trainScheduleId: trainScheduleId,
            trainCompartmentId: trainCompartment.id,
          },
        },
      });

      if (!compartmentBooking) {
        compartmentBooking = await prisma.compartmentBooking.create({
          data: {
            trainScheduleId: trainScheduleId,
            trainCompartmentId: trainCompartment.id,
            bookedSeats: 0,
            totalSeats: trainCompartment.compartment.totalSeats,
          },
        });
      }

      // Check if compartment has available seats
      if (compartmentBooking.bookedSeats >= compartmentBooking.totalSeats) {
        return reply
          .code(409)
          .send({ error: 'No seats available in this compartment for this train and date' });
      }

      // Use a transaction to ensure atomicity
      try {
        // Calculate distance-based price
        const journeyDistance =
          toStationInRoute.distanceFromStart - fromStationInRoute.distanceFromStart;

        console.log(`Price calculation: Distance from ${fromStationInRoute.distanceFromStart}km to ${toStationInRoute.distanceFromStart}km = ${journeyDistance}km`);
        console.log(`Compartment price: ${trainCompartment.compartment.price} per km`);

        // Validate distance is positive
        if (journeyDistance <= 0) {
          return reply.code(400).send({ error: 'Invalid journey distance calculation' });
        }

        // Validate compartment price exists and is positive
        if (!trainCompartment.compartment.price || trainCompartment.compartment.price <= 0) {
          return reply.code(400).send({ error: 'Invalid compartment price configuration' });
        }

        const price = Math.round((journeyDistance * trainCompartment.compartment.price) * 100) / 100; // Round to 2 decimal places

        console.log(`Final price: ${journeyDistance}km * ${trainCompartment.compartment.price} = ${price}`);

        // Validate final price is reasonable
        if (price <= 0) {
          return reply.code(400).send({ error: 'Calculated price is invalid' });
        }

        // Generate unique ticket ID outside transaction for better performance
        const ticketId = generateTicketId(trainSchedule.train.name, trainSchedule.date, seatNumber);

        const ticket = await prisma.$transaction(async (tx) => {
          // Find or create the seat record
          let seat = await tx.seat.findUnique({
            where: {
              trainCompartmentId_seatNumber: {
                trainCompartmentId: trainCompartment.id,
                seatNumber,
              },
            },
          });

          if (!seat) {
            // Seat doesn't exist, create it with just the seat number
            seat = await tx.seat.create({
              data: {
                trainCompartmentId: trainCompartment.id,
                seatNumber,
                isAvailable: false, // Mark as unavailable immediately since we're booking it
              },
            });
          } else {
            // Seat exists, mark as unavailable (we already checked for existing tickets above)
            seat = await tx.seat.update({
              where: { id: seat.id },
              data: { isAvailable: false },
            });
          }

          // Create the ticket (simplified includes for transaction performance)
          return await tx.ticket.create({
            data: {
              ticketId,
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
              expiresAt: addMinutes(
                new Date(),
                parseInt(process.env.BOOKING_EXPIRY_MINUTES || '10'),
              ),
            },
          });
        });

        // Update compartment booking count outside transaction for better performance
        try {
          await prisma.compartmentBooking.update({
            where: {
              trainScheduleId_trainCompartmentId: {
                trainScheduleId: trainScheduleId,
                trainCompartmentId: trainCompartment.id,
              },
            },
            data: {
              bookedSeats: {
                increment: 1,
              },
            },
          });
        } catch (compartmentError) {
          console.error('Failed to update compartment booking:', compartmentError);
          // Don't throw here - ticket is still valid, just log the error
        }

        // Fetch complete ticket data with all includes (outside transaction for performance)
        const completeTicket = await prisma.ticket.findUnique({
          where: { id: ticket.id },
          select: {
            id: true,
            ticketId: true,
            userId: true,
            trainScheduleId: true,
            fromStationId: true,
            toStationId: true,
            seatId: true,
            trainCompartmentId: true,
            seatNumber: true,
            passengerName: true,
            passengerAge: true,
            passengerGender: true,
            price: true,
            status: true,
            paymentStatus: true,
            expiresAt: true,
            confirmedAt: true,
            createdAt: true,
            updatedAt: true,
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

        if (!completeTicket) {
          console.error('Failed to fetch complete ticket data for ID:', ticket.id);
          throw new Error('Ticket created but could not retrieve complete data');
        }

        // Transform to clean response format
        const bookingResponse = {
          ticket: {
            id: completeTicket.id,
            ticketId: completeTicket.ticketId,
            status: completeTicket.status,
            paymentStatus: completeTicket.paymentStatus,
            expiresAt: completeTicket.expiresAt,
            createdAt: completeTicket.createdAt,
          },
          passenger: {
            name: completeTicket.passengerName,
            age: completeTicket.passengerAge,
            gender: completeTicket.passengerGender,
          },
          journey: {
            train: {
              name: completeTicket.trainSchedule.train.name,
              number: completeTicket.trainSchedule.train.number,
            },
            route: {
              from: completeTicket.fromStation.name,
              to: completeTicket.toStation.name,
            },
            schedule: {
              date: completeTicket.trainSchedule.date.toISOString().split('T')[0], // YYYY-MM-DD format
              departureTime: completeTicket.trainSchedule.time,
            },
          },
          seat: {
            number: completeTicket.seatNumber,
            compartment: completeTicket.seat.trainCompartment.compartment.name,
            class: completeTicket.seat.trainCompartment.compartment.class,
          },
          pricing: {
            amount: completeTicket.price,
            currency: 'BDT',
          },
        };

        reply.code(201).send(bookingResponse);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(409).send({ error: 'Seat already booked' });
        }
        throw error;
      }
    },
  );

  // Get user's tickets - Authenticated users
  fastify.get(
    '/tickets',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get current user tickets',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        response: {
          200: ticketsListResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
        orderBy: [{ createdAt: 'desc' }],
      });

      // Transform to clean response format
      const ticketList = tickets.map((ticket) => ({
        ticket: {
          id: ticket.id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          createdAt: ticket.createdAt,
        },
        journey: {
          train: {
            name: ticket.trainSchedule.train.name,
            number: ticket.trainSchedule.train.number,
          },
          route: {
            from: ticket.fromStation.name,
            to: ticket.toStation.name,
          },
          schedule: {
            date: ticket.trainSchedule.date.toISOString().split('T')[0], // YYYY-MM-DD format
            departureTime: ticket.trainSchedule.time,
          },
        },
        seat: {
          number: ticket.seatNumber,
          compartment: ticket.seat.trainCompartment.compartment.name,
        },
        pricing: {
          amount: ticket.price,
          currency: 'BDT',
        },
      }));

      reply.send(ticketList);
    },
  );

  // Get ticket by ID - Authenticated users (only own tickets)
  fastify.get(
    '/tickets/:id',
    {
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
          200: ticketBookingResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: number }).id;

      const ticket = await prisma.ticket.findFirst({
        where: {
          ticketId: id,
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

      // Transform to clean response format
      const ticketResponse = {
        ticket: {
          id: ticket.id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          expiresAt: ticket.expiresAt,
          createdAt: ticket.createdAt,
        },
        passenger: {
          name: ticket.passengerName,
          age: ticket.passengerAge,
          gender: ticket.passengerGender,
        },
        journey: {
          train: {
            name: ticket.trainSchedule.train.name,
            number: ticket.trainSchedule.train.number,
          },
          route: {
            from: ticket.fromStation.name,
            to: ticket.toStation.name,
          },
          schedule: {
            date: ticket.trainSchedule.date.toISOString().split('T')[0], // YYYY-MM-DD format
            departureTime: ticket.trainSchedule.time,
          },
        },
        seat: {
          number: ticket.seatNumber,
          compartment: ticket.seat.trainCompartment.compartment.name,
          class: ticket.seat.trainCompartment.compartment.class,
        },
        pricing: {
          amount: ticket.price,
          currency: 'BDT',
        },
      };

      reply.send(ticketResponse);
    },
  );

  // Cancel ticket - Authenticated users (only own tickets)
  fastify.put(
    '/tickets/:id/cancel',
    {
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
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: number }).id;

      // Check if ticket exists and belongs to user
      const ticket = await prisma.ticket.findFirst({
        where: {
          ticketId: id,
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

        // Decrement compartment booking count
        await tx.compartmentBooking.update({
          where: {
            trainScheduleId_trainCompartmentId: {
              trainScheduleId: ticket.trainScheduleId,
              trainCompartmentId: ticket.trainCompartmentId,
            },
          },
          data: {
            bookedSeats: {
              decrement: 1,
            },
          },
        });

        // Update ticket status
        return await tx.ticket.update({
          where: { id: ticket.id },
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
    },
  );

  // Get all tickets - Admin only
  fastify.get(
    '/admin/tickets',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get all booked tickets with filtering (Admin only)',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED']
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
            },
            userId: { type: 'integer' },
            trainId: { type: 'integer' },
            ticketId: { type: 'string' },
            passengerName: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            travelStartDate: { type: 'string', format: 'date' },
            travelEndDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              tickets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    ticketId: { type: 'string' },
                    status: { type: 'string' },
                    paymentStatus: { type: 'string' },
                    passengerName: { type: 'string' },
                    passengerAge: { type: 'number' },
                    passengerGender: { type: 'string' },
                    price: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' },
                      },
                    },
                    trainSchedule: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        date: { type: 'string', format: 'date-time' },
                        time: { type: 'string' },
                        train: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            number: { type: 'string' },
                          },
                        },
                      },
                    },
                    fromStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                      },
                    },
                    toStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                      },
                    },
                    seat: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        seatNumber: { type: 'string' },
                        trainCompartment: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            compartment: {
                              type: 'object',
                              properties: {
                                id: { type: 'number' },
                                name: { type: 'string' },
                                type: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { role: string };

      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      const query = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        paymentStatus?: string;
        userId?: number;
        trainId?: number;
        ticketId?: string;
        passengerName?: string;
        startDate?: string;
        endDate?: string;
        travelStartDate?: string;
        travelEndDate?: string;
      };

      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const offset = (page - 1) * limit;

      const where: any = {};

      // Status filters
      if (query.status) {
        where.status = query.status;
      }
      if (query.paymentStatus) {
        where.paymentStatus = query.paymentStatus;
      }

      // User filter
      if (query.userId) {
        where.userId = query.userId;
      }

      // Train filter
      if (query.trainId) {
        where.trainSchedule = {
          trainId: query.trainId,
        };
      }

      // Ticket ID filter
      if (query.ticketId) {
        where.ticketId = {
          contains: query.ticketId,
          mode: 'insensitive',
        };
      }

      // Passenger name filter
      if (query.passengerName) {
        where.passengerName = {
          contains: query.passengerName,
          mode: 'insensitive',
        };
      }

      // Date range filters
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
        }
      }

      // Travel date filters
      if (query.travelStartDate || query.travelEndDate) {
        where.trainSchedule = where.trainSchedule || {};
        where.trainSchedule.date = {};
        if (query.travelStartDate) {
          where.trainSchedule.date.gte = new Date(query.travelStartDate);
        }
        if (query.travelEndDate) {
          where.trainSchedule.date.lte = new Date(query.travelEndDate + 'T23:59:59.999Z');
        }
      }

      try {
        const [tickets, total] = await Promise.all([
          prisma.ticket.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
              trainSchedule: {
                include: {
                  train: {
                    select: {
                      id: true,
                      name: true,
                      number: true,
                    },
                  },
                },
              },
              fromStation: {
                select: {
                  id: true,
                  name: true,
                },
              },
              toStation: {
                select: {
                  id: true,
                  name: true,
                },
              },
              seat: {
                include: {
                  trainCompartment: {
                    include: {
                      compartment: {
                        select: {
                          id: true,
                          name: true,
                          type: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          prisma.ticket.count({
            where,
          }),
        ]);

        const totalPages = Math.ceil(total / limit);

        reply.send({
          tickets,
          page,
          limit,
          total,
          totalPages,
        });
      } catch (error) {
        console.error('Admin ticket retrieval error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'Ticket retrieval failed',
        });
      }
    },
  );
}

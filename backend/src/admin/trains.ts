import { FastifyInstance } from 'fastify'
import { createTrainSchema, CreateTrainInput, updateTrainSchema, UpdateTrainInput } from '../schemas/admin'
import { ResponseHandler } from '../shared/utils/response.handler'
import { ConflictError, NotFoundError } from '../shared/errors'
import { authenticateAdmin, authenticateUser } from '../shared/middleware/auth.middleware'

export async function trainRoutes(app: FastifyInstance) {
  // Create train
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new train',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'number', 'type'],
        properties: {
          name: { type: 'string' },
          number: { type: 'string' },
          type: { type: 'string' },
          trainRouteId: { type: 'string' },
          compartmentIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
                    },
                  },
                },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const trainData: CreateTrainInput = createTrainSchema.parse(request.body)

      // Check if train number already exists
      const existingTrain = await (app as any).prisma.train.findUnique({
        where: { number: trainData.number },
      })

      if (existingTrain) {
        throw new ConflictError('Train with this number already exists')
      }

      // Check if train route exists (if provided)
      if (trainData.trainRouteId) {
        const trainRoute = await (app as any).prisma.trainRoute.findUnique({
          where: { id: trainData.trainRouteId },
        })
        if (!trainRoute) {
          throw new NotFoundError('Train route not found')
        }
      }

      // Check if compartments exist (if provided)
      if (trainData.compartmentIds && trainData.compartmentIds.length > 0) {
        const existingCompartments = await (app as any).prisma.compartment.findMany({
          where: { id: { in: trainData.compartmentIds } },
        })
        if (existingCompartments.length !== trainData.compartmentIds.length) {
          throw new NotFoundError('One or more compartments not found')
        }
      }

      const train = await (app as any).prisma.train.create({
        data: {
          name: trainData.name,
          number: trainData.number,
          type: trainData.type,
          trainRouteId: trainData.trainRouteId,
          compartments: trainData.compartmentIds ? {
            create: trainData.compartmentIds.map(compartmentId => ({
              compartmentId,
            })),
          } : undefined,
        },
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.created(reply, train, 'Train created successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Get all trains
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all trains',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  number: { type: 'string' },
                  type: { type: 'string' },
                  trainRouteId: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const trains = await (app as any).prisma.train.findMany({
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return ResponseHandler.success(reply, trains)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Get train by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get train by ID',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                trainRoute: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
                    },
                  },
                },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const train = await (app as any).prisma.train.findUnique({
        where: { id },
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      if (!train) {
        throw new NotFoundError('Train not found')
      }

      return ResponseHandler.success(reply, train)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Update train
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update train',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          number: { type: 'string' },
          type: { type: 'string' },
          trainRouteId: { type: 'string' },
          compartmentIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
                    },
                  },
                },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const updateData: UpdateTrainInput = updateTrainSchema.parse(request.body)

      // Check if number is being updated and if it conflicts
      if (updateData.number) {
        const existingTrain = await (app as any).prisma.train.findFirst({
          where: {
            number: updateData.number,
            id: { not: id },
          },
        })

        if (existingTrain) {
          throw new ConflictError('Train with this number already exists')
        }
      }

      // Check if train route exists (if provided)
      if (updateData.trainRouteId) {
        const trainRoute = await (app as any).prisma.trainRoute.findUnique({
          where: { id: updateData.trainRouteId },
        })
        if (!trainRoute) {
          throw new NotFoundError('Train route not found')
        }
      }

      // Check if compartments exist (if provided)
      if (updateData.compartmentIds) {
        const existingCompartments = await (app as any).prisma.compartment.findMany({
          where: { id: { in: updateData.compartmentIds } },
        })
        if (existingCompartments.length !== updateData.compartmentIds.length) {
          throw new NotFoundError('One or more compartments not found')
        }

        // Delete existing compartments and create new ones
        await (app as any).prisma.trainCompartment.deleteMany({
          where: { trainId: id },
        })
      }

      const updatePayload: any = {}
      if (updateData.name) updatePayload.name = updateData.name
      if (updateData.number) updatePayload.number = updateData.number
      if (updateData.type) updatePayload.type = updateData.type
      if (updateData.trainRouteId !== undefined) updatePayload.trainRouteId = updateData.trainRouteId

      if (updateData.compartmentIds) {
        updatePayload.compartments = {
          create: updateData.compartmentIds.map(compartmentId => ({
            compartmentId,
          })),
        }
      }

      const train = await (app as any).prisma.train.update({
        where: { id },
        data: updatePayload,
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.success(reply, train, 'Train updated successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return ResponseHandler.error(reply, 'Train not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Delete train
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete train',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await (app as any).prisma.train.delete({
        where: { id },
      })

      return ResponseHandler.success(reply, null, 'Train deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return ResponseHandler.error(reply, 'Train not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Get trains for purchase ticket (User authentication required)
  app.get('/search', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get trains available for purchase between two stations on a specific date',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['from_station_id', 'to_station_id', 'date'],
        properties: {
          from_station_id: { type: 'string' },
          to_station_id: { type: 'string' },
          date: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  number: { type: 'string' },
                  type: { type: 'string' },
                  scheduleId: { type: 'string' },
                  departureTime: { type: 'string' },
                  // arrivalTime: { type: 'string' }, // TODO: Add when arrival time calculation is implemented
                  compartments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        price: { type: 'number' },
                        totalSeat: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { from_station_id, to_station_id, date } = request.query as { from_station_id: string, to_station_id: string, date: string }

      // Parse the date
      const searchDate = new Date(date)
      const searchDateString = searchDate.toISOString().split('T')[0]

      // Step 1: Find ALL routes that contain both stations
      const routesWithBothStations = await (app as any).prisma.trainRouteStation.findMany({
        where: {
          currentStationId: {
            in: [from_station_id, to_station_id]
          }
        },
        select: {
          trainRouteId: true,
          currentStationId: true,
          distanceFromStart: true,
        },
      })

      // Group by route to find routes that have both stations
      const routeMap = new Map<string, Array<{ currentStationId: string; distanceFromStart: number }>>()
      routesWithBothStations.forEach((routeStation: any) => {
        if (!routeMap.has(routeStation.trainRouteId)) {
          routeMap.set(routeStation.trainRouteId, [])
        }
        routeMap.get(routeStation.trainRouteId)!.push({
          currentStationId: routeStation.currentStationId,
          distanceFromStart: routeStation.distanceFromStart,
        })
      })

      // Step 2: Filter routes that have BOTH stations and validate order
      const validRouteIds: string[] = []
      for (const [routeId, stations] of routeMap.entries()) {
        const hasFromStation = stations.find(s => s.currentStationId === from_station_id)
        const hasToStation = stations.find(s => s.currentStationId === to_station_id)

        // Route must have both stations
        if (!hasFromStation || !hasToStation) {
          continue
        }

        // Step 3: Validate that from station comes before to station
        if (hasFromStation.distanceFromStart >= hasToStation.distanceFromStart) {
          continue // Invalid order, skip this route
        }

        // This route is valid
        validRouteIds.push(routeId)
      }

      // If no valid routes found
      if (validRouteIds.length === 0) {
        return ResponseHandler.error(reply, 'No valid train routes found between these stations', 400)
      }

      // Step 4: Get train schedules for the specified date that operate on valid routes
      const schedules = await (app as any).prisma.trainSchedule.findMany({
        where: {
          routeId: {
            in: validRouteIds
          },
          departureDate: {
            gte: new Date(searchDateString + 'T00:00:00.000Z'),
            lt: new Date(searchDateString + 'T23:59:59.999Z'),
          },
        },
        include: {
          train: {
            include: {
              compartments: {
                include: {
                  compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
                },
              },
            },
          },
        },
        orderBy: {
          departureTime: 'asc',
        },
      })

      // Step 5: Format the response to include schedule information
      const trainsWithSchedules = schedules.map((schedule: any) => ({
        id: schedule.train.id,
        name: schedule.train.name,
        number: schedule.train.number,
        type: schedule.train.type,
        scheduleId: schedule.id,
        departureTime: schedule.departureTime.toISOString(),
        // arrivalTime: schedule.arrivalTime.toISOString(), // TODO: Calculate based on route duration
        compartments: schedule.train.compartments.map((tc: any) => tc.compartment),
      }))

      return ResponseHandler.success(reply, trainsWithSchedules)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Check compartment seat booking status (User authentication required)
  app.get('/seat-status/:scheduleId/:compartmentId', {
    preHandler: authenticateUser,
    schema: {
      description: 'Check seat booking status for a compartment on a specific date',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          scheduleId: { type: 'string' },
          compartmentId: { type: 'string' },
        },
        required: ['scheduleId', 'compartmentId'],
      },
      querystring: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
        required: ['date'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                scheduleId: { type: 'string' },
                compartmentId: { type: 'string' },
                date: { type: 'string' },
                totalSeats: { type: 'integer' },
                bookedSeats: { type: 'integer' },
                availableSeats: { type: 'integer' },
                seats: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      seatNumber: { type: 'string' },
                      status: { type: 'string', enum: ['available', 'booked'] },
                      bookingId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { scheduleId, compartmentId } = request.params as { scheduleId: string, compartmentId: string }
      const { date } = request.query as { date: string }

      // Validate schedule exists and matches the date
      const schedule = await (app as any).prisma.trainSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          train: {
            include: {
              compartments: {
                where: { compartmentId },
                include: { compartment: true }
              }
            }
          }
        }
      })

      if (!schedule) {
        throw new NotFoundError('Train schedule not found')
      }

      // Check if the schedule date matches
      const scheduleDate = schedule.departureDate.toISOString().split('T')[0]
      if (scheduleDate !== date) {
        throw new NotFoundError('No schedule found for the specified date')
      }

      // Check if compartment exists on this train
      if (schedule.train.compartments.length === 0) {
        throw new NotFoundError('Compartment not found on this train')
      }

      const compartment = schedule.train.compartments[0].compartment
      const totalSeats = compartment.totalSeat

      // Get all bookings for this schedule and compartment
      const bookings: Array<{ seatNumber: string; id: string }> = await (app as any).prisma.booking.findMany({
        where: {
          scheduleId,
          compartmentId,
        },
        select: {
          seatNumber: true,
          id: true,
        },
      })

      // Create seat status array
      const bookedSeats = new Set(bookings.map(b => b.seatNumber))
      const seats = []

      // Assuming seats are numbered 1 to totalSeats (this could be more sophisticated)
      for (let i = 1; i <= totalSeats; i++) {
        const seatNumber = i.toString()
        const isBooked = bookedSeats.has(seatNumber)
        seats.push({
          seatNumber,
          status: isBooked ? 'booked' : 'available',
          bookingId: isBooked ? bookings.find(b => b.seatNumber === seatNumber)?.id : null,
        })
      }

      const response = {
        scheduleId,
        compartmentId,
        date,
        totalSeats,
        bookedSeats: bookings.length,
        availableSeats: totalSeats - bookings.length,
        seats,
      }

      return ResponseHandler.success(reply, response)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}
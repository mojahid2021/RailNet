/**
 * Train Service
 * 
 * Business logic for train operations
 */

import { prisma, ConflictError, NotFoundError } from '../../../lib'
import { CreateTrainDto, UpdateTrainDto } from '../dtos'

export class TrainService {
  async create(data: CreateTrainDto) {
    // Check if train number already exists
    const existingTrain = await prisma.train.findUnique({
      where: { number: data.number },
    })

    if (existingTrain) {
      throw new ConflictError('Train with this number already exists')
    }

    // Check if train route exists (if provided)
    if (data.trainRouteId) {
      const trainRoute = await prisma.trainRoute.findUnique({
        where: { id: data.trainRouteId },
      })
      if (!trainRoute) {
        throw new NotFoundError('Train route not found')
      }
    }

    // Check if compartments exist (if provided)
    if (data.compartmentIds && data.compartmentIds.length > 0) {
      const existingCompartments = await prisma.compartment.findMany({
        where: { id: { in: data.compartmentIds } },
      })
      if (existingCompartments.length !== data.compartmentIds.length) {
        throw new NotFoundError('One or more compartments not found')
      }
    }

    const train = await prisma.train.create({
      data: {
        name: data.name,
        number: data.number,
        type: data.type,
        trainRouteId: data.trainRouteId,
        compartments: data.compartmentIds ? {
          create: data.compartmentIds.map(compartmentId => ({
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

    return train
  }

  async findAll() {
    const trains = await prisma.train.findMany({
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

    return trains
  }

  async findById(id: string) {
    const train = await prisma.train.findUnique({
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

    return train
  }

  async update(id: string, data: UpdateTrainDto) {
    // Check if number is being updated and if it conflicts
    if (data.number) {
      const existingTrain = await prisma.train.findFirst({
        where: {
          number: data.number,
          id: { not: id },
        },
      })

      if (existingTrain) {
        throw new ConflictError('Train with this number already exists')
      }
    }

    // Check if train route exists (if provided)
    if (data.trainRouteId) {
      const trainRoute = await prisma.trainRoute.findUnique({
        where: { id: data.trainRouteId },
      })
      if (!trainRoute) {
        throw new NotFoundError('Train route not found')
      }
    }

    // Check if compartments exist (if provided)
    if (data.compartmentIds) {
      const existingCompartments = await prisma.compartment.findMany({
        where: { id: { in: data.compartmentIds } },
      })
      if (existingCompartments.length !== data.compartmentIds.length) {
        throw new NotFoundError('One or more compartments not found')
      }

      // Delete existing compartments and create new ones
      await prisma.trainCompartment.deleteMany({
        where: { trainId: id },
      })
    }

    const updatePayload: Record<string, unknown> = {}
    if (data.name) updatePayload.name = data.name
    if (data.number) updatePayload.number = data.number
    if (data.type) updatePayload.type = data.type
    if (data.trainRouteId !== undefined) updatePayload.trainRouteId = data.trainRouteId

    if (data.compartmentIds) {
      updatePayload.compartments = {
        create: data.compartmentIds.map(compartmentId => ({
          compartmentId,
        })),
      }
    }

    try {
      const train = await prisma.train.update({
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

      return train
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new NotFoundError('Train not found')
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      await prisma.train.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Train not found')
      }
      throw error
    }
  }

  async searchForPurchase(fromStationId: string, toStationId: string, date: string) {
    // Parse the date
    const searchDate = new Date(date)
    const searchDateString = searchDate.toISOString().split('T')[0]

    // Step 1: Find ALL routes that contain both stations
    const routesWithBothStations = await prisma.trainRouteStation.findMany({
      where: {
        currentStationId: {
          in: [fromStationId, toStationId]
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
    routesWithBothStations.forEach((routeStation) => {
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
      const hasFromStation = stations.find(s => s.currentStationId === fromStationId)
      const hasToStation = stations.find(s => s.currentStationId === toStationId)

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
      return { valid: false, message: 'No valid train routes found between these stations', trains: [] }
    }

    // Step 4: Get train schedules for the specified date that operate on valid routes
    const schedules = await prisma.trainSchedule.findMany({
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
    const trainsWithSchedules = schedules.map((schedule) => ({
      id: schedule.train.id,
      name: schedule.train.name,
      number: schedule.train.number,
      type: schedule.train.type,
      scheduleId: schedule.id,
      departureTime: schedule.departureTime,
      compartments: schedule.train.compartments.map((tc) => tc.compartment),
    }))

    return { valid: true, trains: trainsWithSchedules }
  }

  async getSeatStatus(scheduleId: string, compartmentId: string, date: string) {
    // Validate schedule exists and matches the date
    const schedule = await prisma.trainSchedule.findUnique({
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
    const bookings: Array<{ seatNumber: string; id: string }> = await prisma.booking.findMany({
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

    // Assuming seats are numbered 1 to totalSeats
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = i.toString()
      const isBooked = bookedSeats.has(seatNumber)
      seats.push({
        seatNumber,
        status: isBooked ? 'booked' : 'available',
        bookingId: isBooked ? bookings.find(b => b.seatNumber === seatNumber)?.id : null,
      })
    }

    return {
      scheduleId,
      compartmentId,
      date,
      totalSeats,
      bookedSeats: bookings.length,
      availableSeats: totalSeats - bookings.length,
      seats,
    }
  }
}

export const trainService = new TrainService()

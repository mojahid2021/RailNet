/**
 * Schedule Service
 * 
 * Business logic for schedule operations
 */

import { prisma } from '../../../core/database/prisma.service'
import { logger } from '../../../core/logger/logger.service'
import { ConflictError, NotFoundError } from '../../../shared/errors'
import { CreateScheduleDto, ScheduleQueryDto } from '../dtos'

export class ScheduleService {
  /**
   * Create a new train schedule with station-by-station timing
   * ADMIN ONLY: This operation requires admin privileges
   */
  async create(input: CreateScheduleDto, adminId?: string) {
    const { trainId, departureTime, stationSchedules } = input

    // Log admin action for audit trail
    logger.info(`Admin ${adminId || 'unknown'} attempting to create schedule for train ${trainId} at ${departureTime}`)

    // Validate train exists and has a route
    const train = await prisma.train.findUnique({
      where: { id: trainId },
      include: {
        trainRoute: {
          include: {
            stations: {
              include: {
                currentStation: true,
                beforeStation: true,
                nextStation: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        },
      },
    })

    if (!train) {
      throw new NotFoundError('Train not found')
    }

    if (!train.trainRoute) {
      throw new ConflictError('Train must be assigned to a route before creating a schedule')
    }

    // Check if schedule already exists for this train at this time
    const existingSchedule = await prisma.trainSchedule.findFirst({
      where: {
        trainId,
        departureTime,
      },
    })

    if (existingSchedule) {
      throw new ConflictError('Schedule already exists for this train at the specified time')
    }

    // Validate that all provided stations are in the train's route
    const routeStations = train.trainRoute.stations
    const routeStationIds = routeStations.map(rs => rs.currentStationId)

    const providedStationIds = stationSchedules.map(ss => ss.stationId)
    const invalidStations = providedStationIds.filter(id => !routeStationIds.includes(id))

    if (invalidStations.length > 0) {
      throw new ConflictError(`Stations not found in train route: ${invalidStations.join(', ')}`)
    }

    // Validate station sequence matches route order
    const routeOrder = routeStations.map(rs => rs.currentStationId)
    const providedOrder = stationSchedules.map(ss => ss.stationId)

    if (JSON.stringify(routeOrder) !== JSON.stringify(providedOrder)) {
      throw new ConflictError('Station sequence must match the train route order')
    }

    // Calculate duration and waiting times
    const stationSchedulesWithCalculations = stationSchedules.map((schedule, index) => {
      const routeStation = routeStations[index]
      const arrivalTime = new Date(schedule.estimatedArrival)
      const departureTimeLocal = new Date(schedule.estimatedDeparture)

      // Calculate duration from previous station
      let durationFromPrevious = 0
      if (index > 0) {
        const prevDeparture = new Date(stationSchedules[index - 1].estimatedDeparture)
        durationFromPrevious = Math.round((arrivalTime.getTime() - prevDeparture.getTime()) / (1000 * 60)) // minutes
      }

      // Calculate waiting time at station
      const waitingTime = Math.round((departureTimeLocal.getTime() - arrivalTime.getTime()) / (1000 * 60)) // minutes

      return {
        stationId: schedule.stationId,
        routeStationId: routeStation.id,
        sequenceOrder: index + 1,
        estimatedArrival: arrivalTime,
        estimatedDeparture: departureTimeLocal,
        durationFromPrevious,
        waitingTime,
        platformNumber: schedule.platformNumber,
        remarks: schedule.remarks,
      }
    })

    // Extract departure date from the first station's departure time
    const departureDate = new Date(stationSchedules[0].estimatedDeparture)

    // Create schedule in transaction
    const schedule = await prisma.$transaction(async (tx) => {
      // Create main schedule
      const newSchedule = await tx.trainSchedule.create({
        data: {
          trainId,
          routeId: train.trainRoute!.id,
          departureDate,
          departureTime,
          status: 'scheduled',
        },
      })

      // Create station schedules
      await tx.stationSchedule.createMany({
        data: stationSchedulesWithCalculations.map(calc => ({
          scheduleId: newSchedule.id,
          stationId: calc.stationId,
          routeStationId: calc.routeStationId,
          sequenceOrder: calc.sequenceOrder,
          estimatedArrival: calc.estimatedArrival,
          estimatedDeparture: calc.estimatedDeparture,
          durationFromPrevious: calc.durationFromPrevious,
          waitingTime: calc.waitingTime,
          platformNumber: calc.platformNumber,
          remarks: calc.remarks,
        })),
      })

      // Return complete schedule with relations
      return tx.trainSchedule.findUnique({
        where: { id: newSchedule.id },
        include: {
          train: {
            select: {
              id: true,
              name: true,
              number: true,
              type: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              startStation: { select: { id: true, name: true } },
              endStation: { select: { id: true, name: true } },
            },
          },
          stationSchedules: {
            include: {
              station: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  district: true,
                },
              },
            },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      })
    })

    // Log successful creation
    logger.info(`Admin ${adminId || 'unknown'} successfully created schedule ${schedule?.id} for train ${trainId}`)

    return schedule
  }

  /**
   * Get schedules with optional filters
   */
  async findAll(filters: ScheduleQueryDto) {
    // Apply defaults and log action
    const appliedFilters = {
      trainId: filters.trainId,
      departureTime: filters.departureTime,
      status: filters.status,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    }

    logger.debug(`Accessing schedule list with filters:`, appliedFilters)

    const where: Record<string, unknown> = {}

    if (filters.trainId) {
      where.trainId = filters.trainId
    }

    if (filters.departureTime) {
      where.departureTime = filters.departureTime
    }

    if (filters.status) {
      where.status = filters.status
    }

    const schedules = await prisma.trainSchedule.findMany({
      where,
      include: {
        train: {
          select: {
            id: true,
            name: true,
            number: true,
            type: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            startStation: { select: { id: true, name: true } },
            endStation: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { stationSchedules: true },
        },
      },
      orderBy: { departureTime: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    })

    const total = await prisma.trainSchedule.count({ where })

    return {
      schedules,
      pagination: {
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        hasMore: (filters.offset || 0) + (filters.limit || 20) < total,
      },
    }
  }

  /**
   * Get schedule by ID with full details
   */
  async findById(scheduleId: string) {
    // Log action
    logger.debug(`Accessing schedule ${scheduleId}`)

    const schedule = await prisma.trainSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        train: {
          select: {
            id: true,
            name: true,
            number: true,
            type: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            startStation: { select: { id: true, name: true } },
            endStation: { select: { id: true, name: true } },
          },
        },
        stationSchedules: {
          include: {
            station: {
              select: {
                id: true,
                name: true,
                city: true,
                district: true,
              },
            },
            updates: {
              orderBy: { updatedAt: 'desc' },
              take: 5, // Last 5 updates
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    })

    if (!schedule) {
      throw new NotFoundError('Schedule not found')
    }

    return schedule
  }
}

export const scheduleService = new ScheduleService()

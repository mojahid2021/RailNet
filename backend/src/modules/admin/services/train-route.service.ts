/**
 * Train Route Service
 * 
 * Business logic for train route operations
 */

import { prisma, NotFoundError } from '../../../lib'
import { CreateTrainRouteDto, UpdateTrainRouteDto } from '../dtos'

export class TrainRouteService {
  async create(data: CreateTrainRouteDto) {
    // Check if start and end stations exist
    const startStation = await prisma.station.findUnique({
      where: { id: data.startStationId },
      select: { id: true, name: true },
    })
    if (!startStation) {
      throw new NotFoundError('Start station not found')
    }

    const endStation = await prisma.station.findUnique({
      where: { id: data.endStationId },
      select: { id: true, name: true },
    })
    if (!endStation) {
      throw new NotFoundError('End station not found')
    }

    // Check if all stations in the route exist
    const stationIds = data.stations.map(s => s.currentStationId)
    const existingStations = await prisma.station.findMany({
      where: { id: { in: stationIds } },
      select: { id: true, name: true },
    })
    if (existingStations.length !== stationIds.length) {
      throw new NotFoundError('One or more stations not found')
    }

    const route = await prisma.trainRoute.create({
      data: {
        name: data.name,
        totalDistance: data.totalDistance,
        startStationId: data.startStationId,
        endStationId: data.endStationId,
        stations: {
          create: data.stations.map(station => ({
            currentStationId: station.currentStationId,
            beforeStationId: station.beforeStationId,
            nextStationId: station.nextStationId,
            distance: station.distance,
            distanceFromStart: station.distanceFromStart,
          })),
        },
      },
      include: {
        startStation: { select: { id: true, name: true } },
        endStation: { select: { id: true, name: true } },
        stations: {
          include: {
            currentStation: { select: { id: true, name: true } },
          },
          orderBy: { distanceFromStart: 'asc' },
        },
      },
    })

    return route
  }

  async findAll() {
    const routes = await prisma.trainRoute.findMany({
      include: {
        startStation: { select: { id: true, name: true } },
        endStation: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return routes
  }

  async findById(id: string) {
    const route = await prisma.trainRoute.findUnique({
      where: { id },
      include: {
        startStation: { select: { id: true, name: true } },
        endStation: { select: { id: true, name: true } },
        stations: {
          include: {
            currentStation: { select: { id: true, name: true } },
          },
          orderBy: { distanceFromStart: 'asc' },
        },
      },
    })

    if (!route) {
      throw new NotFoundError('Train route not found')
    }

    return route
  }

  async update(id: string, data: UpdateTrainRouteDto) {
    const updatePayload: Record<string, unknown> = {}

    if (data.name !== undefined) updatePayload.name = data.name
    if (data.totalDistance !== undefined) updatePayload.totalDistance = data.totalDistance

    if (data.startStationId) {
      const startStation = await prisma.station.findUnique({
        where: { id: data.startStationId },
        select: { id: true },
      })
      if (!startStation) {
        throw new NotFoundError('Start station not found')
      }
      updatePayload.startStationId = data.startStationId
    }

    if (data.endStationId) {
      const endStation = await prisma.station.findUnique({
        where: { id: data.endStationId },
        select: { id: true },
      })
      if (!endStation) {
        throw new NotFoundError('End station not found')
      }
      updatePayload.endStationId = data.endStationId
    }

    try {
      const route = await prisma.trainRoute.update({
        where: { id },
        data: updatePayload,
        include: {
          startStation: { select: { id: true, name: true } },
          endStation: { select: { id: true, name: true } },
          stations: {
            include: {
              currentStation: { select: { id: true, name: true } },
            },
            orderBy: { distanceFromStart: 'asc' },
          },
        },
      })

      return route
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new NotFoundError('Train route not found')
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      await prisma.trainRoute.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Train route not found')
      }
      throw error
    }
  }
}

export const trainRouteService = new TrainRouteService()

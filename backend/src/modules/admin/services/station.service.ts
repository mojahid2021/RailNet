/**
 * Station Service
 * 
 * Business logic for station operations
 */

import { prisma } from '../../../core/database/prisma.service'
import { NotFoundError } from '../../../shared/errors'
import { CreateStationDto, UpdateStationDto } from '../dtos'

export class StationService {
  async create(data: CreateStationDto) {
    const station = await prisma.station.create({
      data,
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        division: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    })

    return station
  }

  async findAll() {
    const stations = await prisma.station.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return stations
  }

  async findById(id: string) {
    const station = await prisma.station.findUnique({
      where: { id },
    })

    if (!station) {
      throw new NotFoundError('Station not found')
    }

    return station
  }

  async update(id: string, data: UpdateStationDto) {
    try {
      const station = await prisma.station.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          division: true,
          latitude: true,
          longitude: true,
          updatedAt: true,
        },
      })

      return station
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new NotFoundError('Station not found')
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      await prisma.station.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Station not found')
      }
      throw error
    }
  }
}

export const stationService = new StationService()

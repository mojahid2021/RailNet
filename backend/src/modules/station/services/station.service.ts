/**
 * Station Service
 * 
 * Business logic for station management
 */

import { prisma } from '../../../core/database/prisma.service';
import { NotFoundError } from '../../../shared/errors';
import { CreateStationDto, UpdateStationDto } from '../dtos';

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
        updatedAt: true,
      },
    });

    return station;
  }

  async findAll() {
    const stations = await prisma.station.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        division: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stations;
  }

  async findById(id: string) {
    const station = await prisma.station.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        division: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!station) {
      throw new NotFoundError('Station not found');
    }

    return station;
  }

  async update(id: string, data: UpdateStationDto) {
    // Check if station exists
    await this.findById(id);

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
        createdAt: true,
        updatedAt: true,
      },
    });

    return station;
  }

  async delete(id: string) {
    // Check if station exists
    await this.findById(id);

    await prisma.station.delete({
      where: { id },
    });
  }
}

export const stationService = new StationService();

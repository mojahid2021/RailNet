/**
 * Station service for RailNet Backend
 * Handles station management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError } from '../../shared/errors';
import { CreateStationData, UpdateStationData, Station } from '../../types/common';

export class StationService {
  private prisma = getPrismaClient();

  /**
   * Create a new station
   */
  async createStation(data: CreateStationData): Promise<Station> {
    const endTimer = appLogger.startTimer('create-station');

    try {
      // Generate a unique station code from the name if not provided
      let code = data.code;
      if (!code) {
        const baseCode = data.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 6);

        code = baseCode;
        let counter = 1;

        // Ensure unique code
        while (await this.prisma.station.findUnique({ where: { code } })) {
          code = `${baseCode}${counter}`;
          counter++;
        }
      }

      const station = await this.prisma.station.create({
        data: {
          name: data.name,
          code,
          city: data.city,
          state: data.state,
          country: data.country || 'India',
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: true,
        },
      });

      endTimer();
      appLogger.info('Station created successfully', { stationId: station.id });

      return station;

    } catch (error) {
      endTimer();
      appLogger.error('Station creation failed', { error });
      throw error;
    }
  }

  /**
   * Get station by ID
   */
  async getStationById(stationId: string): Promise<Station> {
    const endTimer = appLogger.startTimer('get-station-by-id');

    try {
      const station = await this.prisma.station.findUnique({
        where: { id: stationId },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!station) {
        throw new NotFoundError('Station');
      }

      endTimer();
      return station;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get station by ID', { error, stationId });
      throw error;
    }
  }

  /**
   * Get station by code
   */
  async getStationByCode(code: string): Promise<Station> {
    const endTimer = appLogger.startTimer('get-station-by-code');

    try {
      const station = await this.prisma.station.findUnique({
        where: { code },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!station) {
        throw new NotFoundError('Station');
      }

      endTimer();
      return station;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get station by code', { error, code });
      throw error;
    }
  }

  /**
   * Get all stations
   */
  async getAllStations(): Promise<Station[]> {
    const endTimer = appLogger.startTimer('get-all-stations');

    try {
      const stations = await this.prisma.station.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      });

      endTimer();
      return stations;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get all stations', { error });
      throw error;
    }
  }

  /**
   * Update station
   */
  async updateStation(stationId: string, data: UpdateStationData): Promise<Station> {
    const endTimer = appLogger.startTimer('update-station');

    try {
      const station = await this.prisma.station.update({
        where: { id: stationId },
        data: {
          name: data.name,
          code: data.code,
          city: data.city,
          state: data.state,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: data.isActive,
        },
      });

      endTimer();
      appLogger.info('Station updated successfully', { stationId });

      return station;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to update station', { error, stationId });
      throw error;
    }
  }

  /**
   * Deactivate station
   */
  async deactivateStation(stationId: string): Promise<void> {
    const endTimer = appLogger.startTimer('deactivate-station');

    try {
      await this.prisma.station.update({
        where: { id: stationId },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('Station deactivated successfully', { stationId });

    } catch (error) {
      endTimer();
      appLogger.error('Failed to deactivate station', { error, stationId });
      throw error;
    }
  }

  /**
   * Search stations
   */
  async searchStations(query: string): Promise<Station[]> {
    const endTimer = appLogger.startTimer('search-stations');

    try {
      const stations = await this.prisma.station.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
        take: 50, // Limit results
      });

      endTimer();
      return stations;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to search stations', { error, query });
      throw error;
    }
  }
}
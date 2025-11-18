/**
 * Station service for RailNet Backend
 * Handles station management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError } from '../../shared/errors';

export interface CreateStationData {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface StationData {
  id: string;
  name: string;
  code: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StationService {
  private prisma = getPrismaClient();

  /**
   * Create a new station
   */
  async createStation(data: CreateStationData): Promise<StationData> {
    const endTimer = appLogger.startTimer('create-station');

    try {
      // Generate a unique station code from the name
      const baseCode = data.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Ensure unique code
      while (await this.prisma.station.findUnique({ where: { code } })) {
        code = `${baseCode}${counter}`;
        counter++;
      }

      // Create station
      const station = await this.prisma.station.create({
        data: {
          name: data.name,
          code,
          city: data.name, // For now, use name as city, can be updated later
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: true,
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
      });

      endTimer();
      appLogger.info('Station created successfully', {
        stationId: station.id,
        stationName: station.name,
        stationCode: station.code,
      });

      return station as StationData;

    } catch (error) {
      endTimer();
      appLogger.error('Station creation failed', { error, stationName: data.name });
      throw error;
    }
  }

  /**
   * Get station by ID
   */
  async getStationById(stationId: string): Promise<StationData> {
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
      return station as StationData;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get station by ID', { error, stationId });
      throw error;
    }
  }

  /**
   * Get station by code
   */
  async getStationByCode(code: string): Promise<StationData> {
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
      return station as StationData;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get station by code', { error, code });
      throw error;
    }
  }

  /**
   * Get all active stations
   */
  async getAllStations(): Promise<StationData[]> {
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
      return stations as StationData[];

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get all stations', { error });
      throw error;
    }
  }

  /**
   * Update station
   */
  async updateStation(stationId: string, updates: Partial<CreateStationData>): Promise<StationData> {
    const endTimer = appLogger.startTimer('update-station');

    try {
      const station = await this.prisma.station.update({
        where: { id: stationId },
        data: updates,
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

      endTimer();
      appLogger.info('Station updated successfully', { stationId, updates });

      return station as StationData;

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
   * Search stations by name or code
   */
  async searchStations(query: string): Promise<StationData[]> {
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
      return stations as StationData[];

    } catch (error) {
      endTimer();
      appLogger.error('Failed to search stations', { error, query });
      throw error;
    }
  }
}
/**
 * Train service for RailNet Backend
 * Handles train management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError } from '../../shared/errors';

export interface CoachConfig {
  coachTypeCode: string;
  count: number;
}

export interface CreateTrainData {
  name: string;
  number: string;
  type: 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'PASSENGER' | 'SHATABDI' | 'RAJDHANI';
  routeId?: string;
  coaches: CoachConfig[];
}

export interface UpdateTrainData {
  name?: string;
  number?: string;
  type?: 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'PASSENGER' | 'SHATABDI' | 'RAJDHANI';
  routeId?: string;
}

export interface TrainData {
  id: string;
  name: string;
  number: string;
  type: 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'PASSENGER' | 'SHATABDI' | 'RAJDHANI';
  routeId: string | null;
  totalSeats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  route?: {
    id: string;
    name: string;
    code: string;
    distance: number;
    duration: number;
  } | null;
  coaches?: Array<{
    id: string;
    coachNumber: string;
    totalSeats: number;
    coachType: {
      id: string;
      name: string;
      code: string;
      ratePerKm: number;
    };
  }>;
}

export class TrainService {
  private prisma = getPrismaClient();

  /**
   * Create a new train with coaches
   */
  async createTrain(data: CreateTrainData): Promise<TrainData> {
    const endTimer = appLogger.startTimer('create-train');

    try {
      // Validate route exists if provided
      if (data.routeId) {
        const route = await this.prisma.route.findUnique({
          where: { id: data.routeId },
        });
        if (!route) {
          throw new NotFoundError('Route not found');
        }
      }

      // Check if train number already exists
      const existingTrain = await this.prisma.train.findUnique({
        where: { number: data.number },
      });
      if (existingTrain) {
        throw new Error(`Train number ${data.number} already exists`);
      }

      // Validate coach types and calculate total seats
      let totalSeats = 0;
      const coachCreations: Array<{
        coachTypeId: string;
        coachNumber: string;
        totalSeats: number;
      }> = [];

      for (const coachConfig of data.coaches) {
        const coachType = await this.prisma.coachType.findUnique({
          where: { code: coachConfig.coachTypeCode },
        });
        if (!coachType) {
          throw new NotFoundError(`Coach type ${coachConfig.coachTypeCode} not found`);
        }

        // Generate coach numbers and calculate seats
        for (let i = 1; i <= coachConfig.count; i++) {
          const coachNumber = `${coachType.code}${String(i).padStart(2, '0')}`;
          coachCreations.push({
            coachTypeId: coachType.id,
            coachNumber,
            totalSeats: coachType.totalSeats,
          });
          totalSeats += coachType.totalSeats;
        }
      }

      // Create train with coaches in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create train
        const train = await tx.train.create({
          data: {
            name: data.name,
            number: data.number,
            type: data.type,
            routeId: data.routeId,
            totalSeats,
          },
          include: {
            route: {
              select: {
                id: true,
                name: true,
                code: true,
                distance: true,
                duration: true,
              },
            },
          },
        });

        // Create coaches
        for (const coachData of coachCreations) {
          await tx.coach.create({
            data: {
              trainId: train.id,
              coachTypeId: coachData.coachTypeId,
              coachNumber: coachData.coachNumber,
              totalSeats: coachData.totalSeats,
            },
          });
        }

        return train;
      });

      endTimer();
      appLogger.info('Train created successfully', {
        trainId: result.id,
        trainNumber: result.number,
        trainName: result.name,
        totalSeats,
        coachCount: coachCreations.length,
      });

      return result;
    } catch (error) {
      endTimer();
      appLogger.error('Train creation failed', { error, data });
      throw error;
    }
  }

  /**
   * Get all trains
   */
  async getAllTrains(includeCoaches: boolean = false): Promise<TrainData[]> {
    const endTimer = appLogger.startTimer('get-all-trains');

    try {
      const trains = await this.prisma.train.findMany({
        where: { isActive: true },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              distance: true,
              duration: true,
            },
          },
          coaches: includeCoaches ? {
            where: { isActive: true },
            select: {
              id: true,
              coachNumber: true,
              totalSeats: true,
              coachType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  ratePerKm: true,
                },
              },
            },
            orderBy: { coachNumber: 'asc' },
          } : false,
        },
        orderBy: { name: 'asc' },
      });

      endTimer();
      return trains;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get all trains', { error });
      throw error;
    }
  }

  /**
   * Get train by ID
   */
  async getTrainById(id: string, includeCoaches: boolean = false): Promise<TrainData | null> {
    const endTimer = appLogger.startTimer('get-train-by-id');

    try {
      const train = await this.prisma.train.findUnique({
        where: { id },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              distance: true,
              duration: true,
            },
          },
          coaches: includeCoaches ? {
            where: { isActive: true },
            select: {
              id: true,
              coachNumber: true,
              totalSeats: true,
              coachType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  ratePerKm: true,
                },
              },
            },
            orderBy: { coachNumber: 'asc' },
          } : false,
        },
      });

      endTimer();
      return train;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get train by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get train by number
   */
  async getTrainByNumber(number: string, includeCoaches: boolean = false): Promise<TrainData | null> {
    const endTimer = appLogger.startTimer('get-train-by-number');

    try {
      const train = await this.prisma.train.findUnique({
        where: { number },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              distance: true,
              duration: true,
            },
          },
          coaches: includeCoaches ? {
            where: { isActive: true },
            select: {
              id: true,
              coachNumber: true,
              totalSeats: true,
              coachType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  ratePerKm: true,
                },
              },
            },
            orderBy: { coachNumber: 'asc' },
          } : false,
        },
      });

      endTimer();
      return train;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get train by number', { error, number });
      throw error;
    }
  }

  /**
   * Update train
   */
  async updateTrain(id: string, data: UpdateTrainData): Promise<TrainData> {
    const endTimer = appLogger.startTimer('update-train');

    try {
      // Check if train exists
      const existingTrain = await this.prisma.train.findUnique({
        where: { id },
      });
      if (!existingTrain) {
        throw new NotFoundError('Train not found');
      }

      // Validate route exists if provided
      if (data.routeId) {
        const route = await this.prisma.route.findUnique({
          where: { id: data.routeId },
        });
        if (!route) {
          throw new NotFoundError('Route not found');
        }
      }

      // Check train number uniqueness if updating
      if (data.number && data.number !== existingTrain.number) {
        const duplicateTrain = await this.prisma.train.findUnique({
          where: { number: data.number },
        });
        if (duplicateTrain) {
          throw new Error(`Train number ${data.number} already exists`);
        }
      }

      const train = await this.prisma.train.update({
        where: { id },
        data,
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              distance: true,
              duration: true,
            },
          },
        },
      });

      endTimer();
      appLogger.info('Train updated successfully', {
        trainId: train.id,
        updatedFields: Object.keys(data),
      });

      return train;
    } catch (error) {
      endTimer();
      appLogger.error('Train update failed', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete train (soft delete)
   */
  async deleteTrain(id: string): Promise<void> {
    const endTimer = appLogger.startTimer('delete-train');

    try {
      const train = await this.prisma.train.findUnique({
        where: { id },
      });
      if (!train) {
        throw new NotFoundError('Train not found');
      }

      await this.prisma.train.update({
        where: { id },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('Train deleted successfully', { trainId: id });
    } catch (error) {
      endTimer();
      appLogger.error('Train deletion failed', { error, id });
      throw error;
    }
  }

  /**
   * Get trains by route
   */
  async getTrainsByRoute(routeId: string, includeCoaches: boolean = false): Promise<TrainData[]> {
    const endTimer = appLogger.startTimer('get-trains-by-route');

    try {
      const trains = await this.prisma.train.findMany({
        where: {
          routeId,
          isActive: true,
        },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              distance: true,
              duration: true,
            },
          },
          coaches: includeCoaches ? {
            where: { isActive: true },
            select: {
              id: true,
              coachNumber: true,
              totalSeats: true,
              coachType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  ratePerKm: true,
                },
              },
            },
            orderBy: { coachNumber: 'asc' },
          } : false,
        },
        orderBy: { name: 'asc' },
      });

      endTimer();
      return trains;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get trains by route', { error, routeId });
      throw error;
    }
  }
}
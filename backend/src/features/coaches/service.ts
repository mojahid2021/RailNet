/**
 * Coach service for RailNet Backend
 * Handles coach management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError } from '../../shared/errors';

export interface CreateCoachData {
  trainId: string;
  coachTypeId: string;
  coachNumber: string;
  totalSeats: number;
}

export interface CoachData {
  id: string;
  trainId: string;
  coachTypeId: string;
  coachNumber: string;
  totalSeats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  coachType: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    ratePerKm: number;
  };
  train: {
    id: string;
    name: string;
    number: string;
  };
}

export class CoachService {
  private prisma = getPrismaClient();

  /**
   * Create a new coach
   */
  async createCoach(data: CreateCoachData): Promise<CoachData> {
    const endTimer = appLogger.startTimer('create-coach');

    try {
      // Validate train exists
      const train = await this.prisma.train.findUnique({
        where: { id: data.trainId },
      });
      if (!train) {
        throw new NotFoundError('Train not found');
      }

      // Validate coach type exists
      const coachType = await this.prisma.coachType.findUnique({
        where: { id: data.coachTypeId },
      });
      if (!coachType) {
        throw new NotFoundError('Coach type not found');
      }

      // Check if coach number already exists for this train
      const existingCoach = await this.prisma.coach.findUnique({
        where: {
          trainId_coachNumber: {
            trainId: data.trainId,
            coachNumber: data.coachNumber,
          },
        },
      });
      if (existingCoach) {
        throw new Error(`Coach number ${data.coachNumber} already exists for this train`);
      }

      const coach = await this.prisma.coach.create({
        data: {
          trainId: data.trainId,
          coachTypeId: data.coachTypeId,
          coachNumber: data.coachNumber,
          totalSeats: data.totalSeats,
        },
        include: {
          coachType: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              ratePerKm: true,
            },
          },
          train: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
      });

      endTimer();
      appLogger.info('Coach created successfully', {
        coachId: coach.id,
        trainId: coach.trainId,
        coachTypeId: coach.coachTypeId,
        coachNumber: coach.coachNumber,
      });

      return coach;
    } catch (error) {
      endTimer();
      appLogger.error('Coach creation failed', { error, data });
      throw error;
    }
  }

  /**
   * Get all coaches for a train
   */
  async getCoachesByTrain(trainId: string): Promise<CoachData[]> {
    const endTimer = appLogger.startTimer('get-coaches-by-train');

    try {
      const coaches = await this.prisma.coach.findMany({
        where: {
          trainId,
          isActive: true,
        },
        include: {
          coachType: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              ratePerKm: true,
            },
          },
          train: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
        orderBy: {
          coachNumber: 'asc',
        },
      });

      endTimer();
      return coaches;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get coaches by train', { error, trainId });
      throw error;
    }
  }

  /**
   * Get coach by ID
   */
  async getCoachById(id: string): Promise<CoachData | null> {
    const endTimer = appLogger.startTimer('get-coach-by-id');

    try {
      const coach = await this.prisma.coach.findUnique({
        where: { id },
        include: {
          coachType: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              ratePerKm: true,
            },
          },
          train: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
      });

      endTimer();
      return coach;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get coach by ID', { error, id });
      throw error;
    }
  }

  /**
   * Update coach
   */
  async updateCoach(id: string, data: Partial<CreateCoachData>): Promise<CoachData> {
    const endTimer = appLogger.startTimer('update-coach');

    try {
      // Check if coach exists
      const existingCoach = await this.prisma.coach.findUnique({
        where: { id },
      });
      if (!existingCoach) {
        throw new NotFoundError('Coach not found');
      }

      // If updating coach number, check for uniqueness
      if (data.coachNumber && data.coachNumber !== existingCoach.coachNumber) {
        const duplicateCoach = await this.prisma.coach.findUnique({
          where: {
            trainId_coachNumber: {
              trainId: existingCoach.trainId,
              coachNumber: data.coachNumber,
            },
          },
        });
        if (duplicateCoach) {
          throw new Error(`Coach number ${data.coachNumber} already exists for this train`);
        }
      }

      // Validate coach type if provided
      if (data.coachTypeId) {
        const coachType = await this.prisma.coachType.findUnique({
          where: { id: data.coachTypeId },
        });
        if (!coachType) {
          throw new NotFoundError('Coach type not found');
        }
      }

      const coach = await this.prisma.coach.update({
        where: { id },
        data,
        include: {
          coachType: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              ratePerKm: true,
            },
          },
          train: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
      });

      endTimer();
      appLogger.info('Coach updated successfully', {
        coachId: coach.id,
        updatedFields: Object.keys(data),
      });

      return coach;
    } catch (error) {
      endTimer();
      appLogger.error('Coach update failed', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete coach (soft delete)
   */
  async deleteCoach(id: string): Promise<void> {
    const endTimer = appLogger.startTimer('delete-coach');

    try {
      const coach = await this.prisma.coach.findUnique({
        where: { id },
      });
      if (!coach) {
        throw new NotFoundError('Coach not found');
      }

      await this.prisma.coach.update({
        where: { id },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('Coach deleted successfully', { coachId: id });
    } catch (error) {
      endTimer();
      appLogger.error('Coach deletion failed', { error, id });
      throw error;
    }
  }

  /**
   * Get all coaches (admin only)
   */
  async getAllCoaches(): Promise<CoachData[]> {
    const endTimer = appLogger.startTimer('get-all-coaches');

    try {
      const coaches = await this.prisma.coach.findMany({
        where: { isActive: true },
        include: {
          coachType: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              ratePerKm: true,
            },
          },
          train: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
        orderBy: [
          { train: { name: 'asc' } },
          { coachNumber: 'asc' },
        ],
      });

      endTimer();
      return coaches;
    } catch (error) {
      endTimer();
      appLogger.error('Failed to get all coaches', { error });
      throw error;
    }
  }
}
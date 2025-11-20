/**
 * Coach Type service for RailNet Backend
 * Handles coach type management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError } from '../../shared/errors';

export interface CreateCoachTypeData {
  name: string;
  description?: string;
  totalSeats: number;
  ratePerKm: number;
}

export interface CoachTypeData {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalSeats: number;
  ratePerKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CoachTypeService {
  private prisma = getPrismaClient();

  /**
   * Create a new coach type
   */
  async createCoachType(data: CreateCoachTypeData): Promise<CoachTypeData> {
    const endTimer = appLogger.startTimer('create-coach-type');

    try {
      // Generate a unique coach type code from the name
      const baseCode = data.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Ensure unique code
      while (await this.prisma.coachType.findUnique({ where: { code } })) {
        code = `${baseCode}${counter}`;
        counter++;
      }

      // Create coach type
      const coachType = await this.prisma.coachType.create({
        data: {
          name: data.name,
          code,
          description: data.description,
          totalSeats: data.totalSeats,
          ratePerKm: data.ratePerKm,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          totalSeats: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      endTimer();
      appLogger.info('Coach type created successfully', {
        coachTypeId: coachType.id,
        coachTypeName: coachType.name,
        coachTypeCode: coachType.code,
      });

      return coachType as CoachTypeData;

    } catch (error) {
      endTimer();
      appLogger.error('Coach type creation failed', { error, coachTypeName: data.name });
      throw error;
    }
  }

  /**
   * Get coach type by ID
   */
  async getCoachTypeById(coachTypeId: string): Promise<CoachTypeData> {
    const endTimer = appLogger.startTimer('get-coach-type-by-id');

    try {
      const coachType = await this.prisma.coachType.findUnique({
        where: { id: coachTypeId },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          totalSeats: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!coachType) {
        throw new NotFoundError('Coach Type');
      }

      endTimer();
      return coachType as CoachTypeData;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get coach type by ID', { error, coachTypeId });
      throw error;
    }
  }

  /**
   * Get coach type by code
   */
  async getCoachTypeByCode(code: string): Promise<CoachTypeData> {
    const endTimer = appLogger.startTimer('get-coach-type-by-code');

    try {
      const coachType = await this.prisma.coachType.findUnique({
        where: { code },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          totalSeats: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!coachType) {
        throw new NotFoundError('Coach Type');
      }

      endTimer();
      return coachType as CoachTypeData;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get coach type by code', { error, code });
      throw error;
    }
  }

  /**
   * Get all active coach types
   */
  async getAllCoachTypes(): Promise<CoachTypeData[]> {
    const endTimer = appLogger.startTimer('get-all-coach-types');

    try {
      const coachTypes = await this.prisma.coachType.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          totalSeats: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { ratePerKm: 'asc' }, // Order by cost (lowest to highest)
      });

      endTimer();
      return coachTypes as CoachTypeData[];

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get all coach types', { error });
      throw error;
    }
  }

  /**
   * Update coach type
   */
  async updateCoachType(coachTypeId: string, updates: Partial<CreateCoachTypeData>): Promise<CoachTypeData> {
    const endTimer = appLogger.startTimer('update-coach-type');

    try {
      const coachType = await this.prisma.coachType.update({
        where: { id: coachTypeId },
        data: updates,
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      endTimer();
      appLogger.info('Coach type updated successfully', { coachTypeId, updates });

      return coachType as CoachTypeData;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to update coach type', { error, coachTypeId });
      throw error;
    }
  }

  /**
   * Deactivate coach type
   */
  async deactivateCoachType(coachTypeId: string): Promise<void> {
    const endTimer = appLogger.startTimer('deactivate-coach-type');

    try {
      await this.prisma.coachType.update({
        where: { id: coachTypeId },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('Coach type deactivated successfully', { coachTypeId });

    } catch (error) {
      endTimer();
      appLogger.error('Failed to deactivate coach type', { error, coachTypeId });
      throw error;
    }
  }

  /**
   * Search coach types by name or code
   */
  async searchCoachTypes(query: string): Promise<CoachTypeData[]> {
    const endTimer = appLogger.startTimer('search-coach-types');

    try {
      const coachTypes = await this.prisma.coachType.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          totalSeats: true,
          ratePerKm: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { ratePerKm: 'asc' },
        take: 50, // Limit results
      });

      endTimer();
      return coachTypes as CoachTypeData[];

    } catch (error) {
      endTimer();
      appLogger.error('Failed to search coach types', { error, query });
      throw error;
    }
  }

  /**
   * Initialize default coach types
   */
  async initializeDefaultCoachTypes(): Promise<void> {
    const endTimer = appLogger.startTimer('initialize-default-coach-types');

    try {
      const defaultCoachTypes = [
        { name: 'Shovan', description: 'Lowest cost general class', ratePerKm: 0.5 },
        { name: 'Shovan Chair', description: 'General class with assigned seating', ratePerKm: 0.75 },
        { name: 'First Class Seat', description: 'First class seating', ratePerKm: 1.5 },
        { name: 'First Class Berth', description: 'First class sleeping berth', ratePerKm: 2.0 },
        { name: 'Snigdha', description: 'Premium non-AC class', ratePerKm: 1.0 },
        { name: 'AC Seat', description: 'Air-conditioned seating', ratePerKm: 2.5 },
        { name: 'AC Berth', description: 'Air-conditioned sleeping berth', ratePerKm: 3.0 },
        { name: 'AC Cabin', description: 'Highest cost air-conditioned cabin', ratePerKm: 4.0 },
      ];

      for (const coachType of defaultCoachTypes) {
        const existing = await this.prisma.coachType.findFirst({
          where: { name: coachType.name },
        });

        if (!existing) {
          await this.createCoachType(coachType);
        }
      }

      endTimer();
      appLogger.info('Default coach types initialized successfully');

    } catch (error) {
      endTimer();
      appLogger.error('Failed to initialize default coach types', { error });
      throw error;
    }
  }
}
/**
 * Prisma Database Service
 * 
 * Singleton service for Prisma database client
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        PrismaService.instance.$on('query' as never, (e: any) => {
          logger.debug('Query: ' + e.query);
          logger.debug('Duration: ' + e.duration + 'ms');
        });
      }

      PrismaService.instance.$on('error' as never, (e: any) => {
        logger.error('Database error:', e);
      });

      PrismaService.instance.$on('warn' as never, (e: any) => {
        logger.warn('Database warning:', e);
      });

      logger.info('Prisma client initialized');
    }

    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      logger.info('Prisma client disconnected');
    }
  }
}

export const prisma = PrismaService.getInstance();
export { PrismaService };

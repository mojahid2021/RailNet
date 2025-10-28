import { config } from '../config';
import prisma from '../utils/database';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
  environment: string;
  database: 'connected' | 'disconnected';
  version: string;
}

export class HealthService {
  /**
   * Check overall health of the service
   */
  async checkHealth(): Promise<HealthStatus> {
    const baseHealth: Omit<HealthStatus, 'database'> = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: '1.0.0',
    };

    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('Database health check passed');

      return {
        ...baseHealth,
        database: 'connected',
      };
    } catch (error) {
      logger.error('Database health check failed', { error });

      return {
        ...baseHealth,
        status: 'error',
        database: 'disconnected',
      };
    }
  }
}
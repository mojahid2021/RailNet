/**
 * Database connection and management for RailNet Backend
 * Provides Prisma client configuration with connection pooling and error handling
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { appLogger } from '../logger';
import { ConnectionError, DatabaseError } from '../../shared/errors';

// Prisma client instance
let prisma: PrismaClient;

/**
 * Get or create Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: config.app.isDevelopment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
          ]
        : [{ level: 'error', emit: 'event' }],
      datasources: {
        db: {
          url: config.database.url,
        },
      },
    });

    // Log database queries in development
    if (config.app.isDevelopment) {
      // Note: Event listeners temporarily disabled due to type issues
      // prisma.$on('query', (e: any) => {
      //   appLogger.debug('Database Query', {
      //     query: e.query,
      //     duration: e.duration,
      //     target: e.target,
      //   });
      // });
    }

    // Log database errors
    // prisma.$on('error', (e: any) => {
    //   appLogger.error('Database Error', {
    //     message: e.message,
    //     target: e.target,
    //   });
    // });

    // Log database warnings
    // prisma.$on('warn', (e: any) => {
    //   appLogger.warn('Database Warning', {
    //     message: e.message,
    //     target: e.target,
    //   });
    // });
  }

  return prisma;
}

/**
 * Initialize database connection
 */
export async function connectDatabase(): Promise<void> {
  const endTimer = appLogger.startTimer('database-connection');

  try {
    const client = getPrismaClient();
    await client.$connect();

    appLogger.info('Database connected successfully', {
      url: config.database.url.replace(/:[^:]+@/, ':***@'), // Hide password in logs
    });

    endTimer();
  } catch (error) {
    endTimer();
    appLogger.error('Database connection failed', { error });

    if (error instanceof Error) {
      throw new ConnectionError(`Failed to connect to database: ${error.message}`);
    }

    throw new ConnectionError('Failed to connect to database');
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect();
      appLogger.info('Database disconnected successfully');
    } catch (error) {
      appLogger.error('Error disconnecting from database', { error });
      throw new DatabaseError('Failed to disconnect from database');
    }
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1 as health_check`;

    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Execute raw SQL query with error handling
 */
export async function executeRawQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T> {
  const endTimer = appLogger.startTimer('raw-query');

  try {
    const client = getPrismaClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (client.$queryRaw as any)(query, ...params);

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    appLogger.error('Raw query execution failed', {
      query,
      params: params.length,
      error,
    });

    throw new DatabaseError('Query execution failed');
  }
}

/**
 * Execute transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const endTimer = appLogger.startTimer('database-transaction');

  try {
    const client = getPrismaClient();
    const result = await client.$transaction(callback);

    endTimer();
    appLogger.debug('Transaction completed successfully');

    return result as T;
  } catch (error) {
    endTimer();
    appLogger.error('Transaction failed', { error });

    throw new DatabaseError('Transaction failed');
  }
}

/**
 * Database migration helpers
 */
export class DatabaseMigrations {
  /**
   * Check if database is up to date with migrations
   */
  static async checkMigrationStatus(): Promise<{
    isUpToDate: boolean;
    pendingMigrations: string[];
    appliedMigrations: string[];
  }> {
    try {
      const client = getPrismaClient();

      // Get applied migrations
      const appliedMigrations = await client.$queryRaw<
        Array<{ migration_name: string }>
      >`
        SELECT migration_name
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY migration_name
      `;

      const appliedMigrationNames = appliedMigrations.map(m => m.migration_name);

      // This is a simplified check - in a real app you'd compare with migration files
      const pendingMigrations: string[] = [];

      return {
        isUpToDate: pendingMigrations.length === 0,
        pendingMigrations,
        appliedMigrations: appliedMigrationNames,
      };
    } catch (error) {
      appLogger.error('Failed to check migration status', { error });
      throw new DatabaseError('Migration status check failed');
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    tableCount: number;
    totalRows: number;
    databaseSize: string;
  }> {
    try {
      const client = getPrismaClient();

      // Get table count
      const tableResult = await client.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      const tableCount = Number(tableResult[0]?.count || 0);

      // Get approximate row count across all tables
      const rowResult = await client.$queryRaw<Array<{ total: bigint }>>`
        SELECT SUM(n_tup_ins - n_tup_del) as total
        FROM pg_stat_user_tables
      `;
      const totalRows = Number(rowResult[0]?.total || 0);

      // Get database size
      const sizeResult = await client.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      const databaseSize = sizeResult[0]?.size || 'Unknown';

      return {
        tableCount,
        totalRows,
        databaseSize,
      };
    } catch (error) {
      appLogger.error('Failed to get database stats', { error });
      throw new DatabaseError('Database stats retrieval failed');
    }
  }
}

// Export default prisma client instance
export default getPrismaClient();
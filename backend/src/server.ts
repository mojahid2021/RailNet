/**
 * RailNet Backend Server Entry Point
 * Main application bootstrap with enhanced error handling and graceful shutdown
 */

import { startServer } from './core/server';
import { config } from './core/config';
import { appLogger } from './core/logger';

/**
 * Application entry point
 * Initializes and starts the RailNet backend server
 */
async function main(): Promise<void> {
  try {
    appLogger.info('🚀 Starting RailNet Backend Server...');

    // Display startup information
    appLogger.info('Application Configuration', {
      environment: config.app.env,
      port: config.app.port,
      host: config.app.host,
      database: config.database.url.replace(/:[^:]+@/, ':***@'), // Hide password
      version: process.env.npm_package_version || '1.0.0',
    });

    // Start the server
    await startServer();

  } catch (error) {
    appLogger.error('❌ Failed to start application', { error });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise),
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  appLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export default main;

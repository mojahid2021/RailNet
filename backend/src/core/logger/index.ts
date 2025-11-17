/**
 * Enhanced logging system for RailNet Backend
 * Provides structured logging with multiple transports and log levels
 */

import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log context interface
export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  [key: string]: unknown;
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry: Record<string, unknown> = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    // Add request context if available
    if (meta.requestId || meta.userId || meta.operation) {
      logEntry.context = {
        requestId: meta.requestId,
        userId: meta.userId,
        operation: meta.operation,
        sessionId: meta.sessionId,
      };
    }

    return JSON.stringify(logEntry, null, config.app.isDevelopment ? 2 : 0);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;

    // Add context information
    const contextParts: string[] = [];
    if (meta.operation) contextParts.push(`op:${meta.operation}`);
    if (meta.userId) contextParts.push(`user:${meta.userId}`);
    if (meta.requestId) contextParts.push(`req:${meta.requestId}`);
    if (meta.duration) contextParts.push(`${meta.duration}ms`);

    if (contextParts.length > 0) {
      log += ` [${contextParts.join(', ')}]`;
    }

    // Add error stack if present
    if (meta.stack) {
      log += `\n${meta.stack}`;
    }

    return log;
  })
);

// Create log directory if it doesn't exist
const logDir = path.dirname(config.logging.filePath);

// Transports configuration
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    level: config.logging.level,
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
];

// File transport for all environments
if (config.logging.filePath) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.filePath,
      level: config.logging.level,
      format: customFormat,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

// Error log file (separate file for errors)
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    handleExceptions: true,
    handleRejections: true,
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: customFormat,
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    format: customFormat,
  })
);

/**
 * Logger class with enhanced functionality
 */
export class Logger {
  private context: LogContext = {};

  /**
   * Create a child logger with persistent context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Set context for all subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log error messages
   */
  error(message: string, meta?: LogContext): void {
    logger.error(message, { ...this.context, ...meta });
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: LogContext): void {
    logger.warn(message, { ...this.context, ...meta });
  }

  /**
   * Log info messages
   */
  info(message: string, meta?: LogContext): void {
    logger.info(message, { ...this.context, ...meta });
  }

  /**
   * Log debug messages
   */
  debug(message: string, meta?: LogContext): void {
    logger.debug(message, { ...this.context, ...meta });
  }

  /**
   * Log with timing - returns a function to log completion
   */
  startTimer(operation: string, meta?: LogContext): () => void {
    const startTime = Date.now();
    const timerContext = { ...this.context, ...meta, operation };

    this.info(`Started: ${operation}`, timerContext);

    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed: ${operation}`, {
        ...timerContext,
        duration,
      });
    };
  }

  /**
   * Log HTTP requests
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: LogContext
  ): void {
    const level = statusCode >= 400 ? 'warn' : statusCode >= 500 ? 'error' : 'info';

    this[level](`${method} ${url} - ${statusCode}`, {
      ...this.context,
      ...meta,
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation: string, table: string, duration: number, meta?: LogContext): void {
    this.debug(`DB ${operation}: ${table}`, {
      ...this.context,
      ...meta,
      operation,
      table,
      duration,
    });
  }

  /**
   * Log authentication events
   */
  logAuth(event: string, userId?: string, meta?: LogContext): void {
    this.info(`Auth: ${event}`, {
      ...this.context,
      ...meta,
      userId,
      event,
    });
  }

  /**
   * Log business operations
   */
  logBusiness(operation: string, entity: string, entityId?: string, meta?: LogContext): void {
    this.info(`Business: ${operation} ${entity}`, {
      ...this.context,
      ...meta,
      operation,
      entity,
      entityId,
    });
  }
}

// Export singleton instance
export const appLogger = new Logger();

/**
 * Request logging middleware factory
 */
export function createRequestLogger() {
  return function requestLogger(req: { headers?: Record<string, string>; method?: string; url?: string; ip?: string; requestId?: string; logger?: Logger }, res: { statusCode?: number; on: (event: string, callback: () => void) => void }, next: () => void) {
    const startTime = Date.now();
    const requestId = req.headers?.['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add request ID to request object
    req.requestId = requestId;

    // Create request logger with context
    const requestLogger = appLogger.child({
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });

    // Store logger on request for use in handlers
    req.logger = requestLogger;

    // Log request start
    requestLogger.info('Request started');

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      requestLogger.logRequest(req.method || 'UNKNOWN', req.url || 'UNKNOWN', res.statusCode || 0, duration);
    });

    next();
  };
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  static end(label: string, logger?: Logger, meta?: LogContext): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger?.warn(`Performance timer '${label}' not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    logger?.debug(`Performance: ${label}`, { ...meta, duration });

    return duration;
  }

  static async measure<T>(
    label: string,
    operation: () => Promise<T>,
    logger?: Logger,
    meta?: LogContext
  ): Promise<T> {
    this.start(label);
    try {
      const result = await operation();
      this.end(label, logger, meta);
      return result;
    } catch (error) {
      this.end(label, logger, { ...meta, error: (error as Error).message });
      throw error;
    }
  }
}
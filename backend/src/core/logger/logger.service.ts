/**
 * Logger Service
 * 
 * Centralized logging service using Pino
 */

import pino from 'pino';
import { ILogger } from '../../common/interfaces';
import config from '../config';

class LoggerService implements ILogger {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    });
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug({ args }, message);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info({ args }, message);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn({ args }, message);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error({ args }, message);
  }

  child(bindings: Record<string, any>): pino.Logger {
    return this.logger.child(bindings);
  }

  getLogger(): pino.Logger {
    return this.logger;
  }
}

export const logger = new LoggerService();

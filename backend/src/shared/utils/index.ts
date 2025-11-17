/**
 * Shared utility functions for RailNet Backend
 * Common helpers for data manipulation, validation, and formatting
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { REGEX_PATTERNS, DB_CONSTRAINTS, API_CONSTANTS } from '../constants';
import { ValidationError } from '../errors';

/**
 * Password utilities
 */
export class PasswordUtils {
  /**
   * Hash a password with bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, DB_CONSTRAINTS.PASSWORD_MIN_LENGTH);
  }

  /**
   * Verify a password against its hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < DB_CONSTRAINTS.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${DB_CONSTRAINTS.PASSWORD_MIN_LENGTH} characters long`);
    }

    if (password.length > DB_CONSTRAINTS.PASSWORD_MAX_LENGTH) {
      errors.push(`Password must be at most ${DB_CONSTRAINTS.PASSWORD_MAX_LENGTH} characters long`);
    }

    if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Capitalize first letter of a string
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Convert string to camelCase
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  }

  /**
   * Convert string to kebab-case
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Generate a random string
   */
  static generateRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Slugify a string (for URLs)
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }
}

/**
 * Date utilities
 */
export class DateUtils {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Format date to human readable string
   */
  static toHumanReadable(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get difference in days between two dates
   */
  static getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is within range
   */
  static isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }
}

/**
 * Array utilities
 */
export class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Shuffle array elements randomly
   */
  static shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Group array elements by key
   */
  static groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
    return arr.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Sort array by multiple keys
   */
  static sortBy<T>(arr: T[], ...keys: Array<keyof T>): T[] {
    return [...arr].sort((a, b) => {
      for (const key of keys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
      }
      return 0;
    });
  }
}

/**
 * Object utilities
 */
export class ObjectUtils {
  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Pick specific properties from an object
   */
  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  /**
   * Omit specific properties from an object
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: Record<string, unknown>): boolean {
    return Object.keys(obj).length === 0;
  }

  /**
   * Get nested property value safely
   */
  static getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj as unknown);
  }

  /**
   * Flatten nested object
   */
  static flatten(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flatten(obj[key] as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    });

    return flattened;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return REGEX_PATTERNS.EMAIL.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    return REGEX_PATTERNS.PHONE.test(phone);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    return REGEX_PATTERNS.URL.test(url);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    return REGEX_PATTERNS.UUID.test(uuid);
  }

  /**
   * Validate file type
   */
  static isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size: number, maxSize: number = API_CONSTANTS.MAX_FILE_SIZE): boolean {
    return size <= maxSize;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate and parse pagination parameters
   */
  static parsePagination(page?: unknown, limit?: unknown) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(
      API_CONSTANTS.MAX_PAGE_SIZE,
      Math.max(1, Number(limit) || API_CONSTANTS.DEFAULT_PAGE_SIZE)
    );

    return { page: parsedPage, limit: parsedLimit };
  }

  /**
   * Validate sort parameters
   */
  static validateSortOrder(order: unknown): 'asc' | 'desc' {
    return order === 'asc' ? 'asc' : 'desc';
  }
}

/**
 * Async utilities
 */
export class AsyncUtils {
  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry async operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute operations in parallel with concurrency limit
   */
  static async parallelLimit<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    concurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    const chunks = ArrayUtils.chunk(items, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(operation));
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Create a timeout promise
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms)
      ),
    ]);
  }
}

/**
 * HTTP utilities
 */
export class HttpUtils {
  /**
   * Build query string from object
   */
  static buildQueryString(params: Record<string, unknown>): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Parse query string to object
   */
  static parseQueryString(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(queryString);

    urlParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(request: { ip?: string; headers?: Record<string, string> }): string {
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers?.['x-real-ip'] ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Check if request is from localhost
   */
  static isLocalhost(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  }
}

/**
 * Zod schema validation helpers
 */
export class SchemaUtils {
  /**
   * Validate data against Zod schema with custom error handling
   */
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context?: string
  ): { success: true; data: T } | { success: false; errors: ValidationError } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const validationError = new ValidationError(
      `Validation failed${context ? ` for ${context}` : ''}`,
      { fields: this.formatZodErrors(result.error) }
    );

    return { success: false, errors: validationError };
  }

  /**
   * Format Zod errors into field-based error structure
   */
  private static formatZodErrors(error: z.ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    return errors;
  }

  /**
   * Common Zod schemas
   */
  static readonly schemas = {
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(DB_CONSTRAINTS.PASSWORD_MIN_LENGTH, `Password must be at least ${DB_CONSTRAINTS.PASSWORD_MIN_LENGTH} characters`)
      .regex(REGEX_PATTERNS.PASSWORD, 'Password must contain uppercase, lowercase, number, and special character'),
    phone: z.string().regex(REGEX_PATTERNS.PHONE, 'Invalid phone number format'),
    url: z.string().url('Invalid URL format'),
    uuid: z.string().uuid('Invalid UUID format'),

    pagination: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(API_CONSTANTS.MAX_PAGE_SIZE).default(API_CONSTANTS.DEFAULT_PAGE_SIZE),
    }),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  };
}
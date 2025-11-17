/**
 * Authentication service for RailNet Backend
 * Handles user registration, login, and profile management
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { PasswordUtils } from '../../shared/utils';
import { generateToken } from '../../core/auth/jwt';
import {
  RegisterData,
  LoginCredentials,
  AuthResponse,
  User as UserType,
  UserRole,
} from '../../types/common';
import {
  AlreadyExistsError,
  AuthenticationError,
  NotFoundError
} from '../../shared/errors';

export class AuthService {
  private prisma = getPrismaClient();

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const endTimer = appLogger.startTimer('user-registration');

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AlreadyExistsError('User with this email already exists');
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validateStrength(data.password);
      if (!passwordValidation.isValid) {
        throw new AuthenticationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hash(data.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || 'PASSENGER', // Default role or provided
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const result: AuthResponse = {
        user: user as UserType,
        token,
      };

      endTimer();
      return result;

    } catch (error) {
      endTimer();
      appLogger.error('User registration failed', { error, email: data.email });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials, requiredRole?: UserRole): Promise<AuthResponse> {
    const endTimer = appLogger.startTimer('user-login');

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.verify(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check role if required
      if (requiredRole && user.role !== requiredRole) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login timestamp (removed - field doesn't exist in schema)

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const result: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };

      endTimer();
      return result;

    } catch (error) {
      endTimer();
      appLogger.error('User login failed', { error, email: credentials.email });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserType> {
    const endTimer = appLogger.startTimer('get-user-profile');

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      endTimer();
      return user as UserType;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to get user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<UserType, 'firstName' | 'lastName'>>): Promise<UserType> {
    const endTimer = appLogger.startTimer('update-user-profile');

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      endTimer();
      appLogger.info('User profile updated', { userId });

      return user as UserType;

    } catch (error) {
      endTimer();
      appLogger.error('Failed to update user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const endTimer = appLogger.startTimer('change-user-password');

    try {
      // Get current user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.verify(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = PasswordUtils.validateStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AuthenticationError(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const hashedNewPassword = await PasswordUtils.hash(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      endTimer();
      appLogger.info('User password changed', { userId });

    } catch (error) {
      endTimer();
      appLogger.error('Failed to change user password', { error, userId });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    const endTimer = appLogger.startTimer('deactivate-user-account');

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('User account deactivated', { userId });

    } catch (error) {
      endTimer();
      appLogger.error('Failed to deactivate user account', { error, userId });
      throw error;
    }
  }

  /**
   * Validate user exists and is active
   */
  async validateUser(userId: string): Promise<UserType> {
    const user = await this.getProfile(userId);

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled');
    }

    return user;
  }

  /**
   * Check if email is available for registration
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !user;
    } catch (error) {
      appLogger.error('Failed to check email availability', { error, email });
      return false;
    }
  }
}
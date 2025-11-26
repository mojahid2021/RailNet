/**
 * Authentication Service
 * 
 * Business logic for user and admin authentication
 */

import bcrypt from 'bcrypt';
import { prisma } from '../../../core/database/prisma.service';
import { JWTUtil } from '../../../shared/utils/jwt.util';
import { ConflictError, NotFoundError } from '../../../shared/errors';
import { RegisterAdminDto, RegisterUserDto, LoginDto } from '../dtos';
import { AUTH, USER_ROLES } from '../../../common/constants';
import { IAdmin, IUser } from '../../../common/types';

export class AuthService {
  async registerAdmin(data: RegisterAdminDto): Promise<Omit<IAdmin, 'password'>> {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: data.email },
    });

    if (existingAdmin) {
      throw new ConflictError('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, AUTH.BCRYPT_SALT_ROUNDS);

    const admin = await prisma.admin.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  async registerUser(data: RegisterUserDto): Promise<Omit<IUser, 'password'>> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, AUTH.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async loginAdmin(data: LoginDto): Promise<{ admin: Omit<IAdmin, 'password'>; token: string }> {
    const admin = await prisma.admin.findUnique({
      where: { email: data.email },
    });

    if (!admin) {
      throw new NotFoundError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, admin.password);
    if (!isPasswordValid) {
      throw new NotFoundError('Invalid credentials');
    }

    const token = JWTUtil.generateToken({
      id: admin.id,
      email: admin.email,
      type: USER_ROLES.ADMIN,
    });

    const adminData = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };

    return { admin: adminData, token };
  }

  async loginUser(data: LoginDto): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new NotFoundError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundError('Invalid credentials');
    }

    const token = JWTUtil.generateToken({
      id: user.id,
      email: user.email,
      type: USER_ROLES.USER,
    });

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: userData, token };
  }

  async getAdminProfile(adminId: string): Promise<Omit<IAdmin, 'password'>> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundError('Admin not found');
    }

    return admin;
  }
}

export const authService = new AuthService();

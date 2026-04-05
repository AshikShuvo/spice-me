import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/enums.js';
import type { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAdminDto } from './dto/create-admin.dto.js';
import type { CreateRestaurantAdminDto } from './dto/create-restaurant-admin.dto.js';
import type { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';

export type UserProfile = Omit<
  User,
  'password' | 'refreshToken' | 'resetPasswordToken'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      resetPasswordExpires: user.resetPasswordExpires,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(query: ListUsersQueryDto): Promise<{
    data: UserProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: users.map((u) => this.toProfile(u)),
      total,
      page,
      limit,
    };
  }

  async findMe(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ...(dto.name !== undefined && { name: dto.name }) },
    });
    return this.toProfile(updated);
  }

  async createAdmin(dto: CreateAdminDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: passwordHash,
        role: Role.ADMIN,
      },
    });
    return this.toProfile(user);
  }

  async createRestaurantAdmin(
    dto: CreateRestaurantAdminDto,
  ): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: passwordHash,
        role: Role.RESTAURANT_ADMIN,
      },
    });
    return this.toProfile(user);
  }

  async updateRole(userId: string, dto: UpdateRoleDto): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });
    return this.toProfile(updated);
  }

  async softDelete(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.$transaction(async (tx) => {
      if (user.role === Role.RESTAURANT_ADMIN) {
        await tx.restaurantAdminAssignment.deleteMany({
          where: { userId },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          refreshToken: null,
        },
      });
    });
    return { message: 'User deactivated' };
  }
}

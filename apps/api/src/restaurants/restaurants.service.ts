import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
import type { Restaurant } from '../../generated/prisma/client.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserProfile } from '../users/users.service.js';
import type { AssignAdminDto } from './dto/assign-admin.dto.js';
import type { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import type { ListRestaurantsQueryDto } from './dto/list-restaurants-query.dto.js';
import type { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';

export type RestaurantProfile = Restaurant;

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  toProfile(r: Restaurant): RestaurantProfile {
    return { ...r };
  }

  private async generateCode(tx: Prisma.TransactionClient): Promise<string> {
    const last = await tx.restaurant.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const next = last ? parseInt(last.code.slice(2), 10) + 1 : 1;
    if (next > 1000) {
      throw new BadRequestException('Restaurant code limit reached');
    }
    return `RQ${String(next).padStart(4, '0')}`;
  }

  async create(dto: CreateRestaurantDto): Promise<RestaurantProfile> {
    const created = await this.prisma.$transaction(async (tx) => {
      const code = await this.generateCode(tx);
      return tx.restaurant.create({
        data: {
          name: dto.name.trim(),
          code,
          address: dto.address.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          timezone: dto.timezone.trim(),
          openingTime: dto.openingTime,
          closingTime: dto.closingTime,
        },
      });
    });
    return this.toProfile(created);
  }

  async findAll(query: ListRestaurantsQueryDto): Promise<{
    data: RestaurantProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count(),
    ]);
    return {
      data: rows.map((r) => this.toProfile(r)),
      total,
      page,
      limit,
    };
  }

  async findDefault(): Promise<RestaurantProfile> {
    const r = await this.prisma.restaurant.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (!r) {
      throw new NotFoundException('No default restaurant configured');
    }
    return this.toProfile(r);
  }

  async findMyRestaurants(userId: string): Promise<RestaurantProfile[]> {
    const assignments = await this.prisma.restaurantAdminAssignment.findMany({
      where: { userId },
      include: { restaurant: true },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => this.toProfile(a.restaurant));
  }

  async findOne(
    id: string,
    requestingUser: JwtUser,
  ): Promise<RestaurantProfile> {
    if (requestingUser.role === Role.ADMIN) {
      const r = await this.prisma.restaurant.findUnique({ where: { id } });
      if (!r) {
        throw new NotFoundException('Restaurant not found');
      }
      return this.toProfile(r);
    }
    if (requestingUser.role === Role.RESTAURANT_ADMIN) {
      const assignment = await this.prisma.restaurantAdminAssignment.findFirst({
        where: { restaurantId: id, userId: requestingUser.userId },
      });
      if (!assignment) {
        throw new ForbiddenException('Not assigned to this restaurant');
      }
      const r = await this.prisma.restaurant.findUnique({ where: { id } });
      if (!r) {
        throw new NotFoundException('Restaurant not found');
      }
      return this.toProfile(r);
    }
    throw new ForbiddenException('Insufficient role');
  }

  async update(
    id: string,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantProfile> {
    const existing = await this.prisma.restaurant.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Restaurant not found');
    }
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone.trim() }),
        ...(dto.openingTime !== undefined && { openingTime: dto.openingTime }),
        ...(dto.closingTime !== undefined && { closingTime: dto.closingTime }),
      },
    });
    return this.toProfile(updated);
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<RestaurantProfile> {
    const existing = await this.prisma.restaurant.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Restaurant not found');
    }
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { isActive },
    });
    return this.toProfile(updated);
  }

  async setDefault(id: string): Promise<RestaurantProfile> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const exists = await tx.restaurant.findUnique({ where: { id } });
      if (!exists) {
        throw new NotFoundException('Restaurant not found');
      }
      await tx.restaurant.updateMany({ data: { isDefault: false } });
      return tx.restaurant.update({
        where: { id },
        data: { isDefault: true },
      });
    });
    return this.toProfile(updated);
  }

  async assignAdmin(
    restaurantId: string,
    dto: AssignAdminDto,
  ): Promise<{ id: string; restaurantId: string; userId: string }> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.RESTAURANT_ADMIN) {
      throw new BadRequestException(
        'User must have role RESTAURANT_ADMIN to be assigned',
      );
    }
    await this.prisma.restaurantAdminAssignment.createMany({
      data: [{ restaurantId, userId: dto.userId }],
      skipDuplicates: true,
    });
    const assignment = await this.prisma.restaurantAdminAssignment.findFirst({
      where: { restaurantId, userId: dto.userId },
    });
    if (!assignment) {
      throw new BadRequestException('Could not create assignment');
    }
    return {
      id: assignment.id,
      restaurantId: assignment.restaurantId,
      userId: assignment.userId,
    };
  }

  async removeAdmin(
    restaurantId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const assignment = await this.prisma.restaurantAdminAssignment.findFirst({
      where: { restaurantId, userId },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    await this.prisma.restaurantAdminAssignment.delete({
      where: { id: assignment.id },
    });
    return { message: 'Assignment removed' };
  }

  async listAdmins(restaurantId: string): Promise<
    Array<{
      id: string;
      assignedAt: Date;
      user: UserProfile;
    }>
  > {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const rows = await this.prisma.restaurantAdminAssignment.findMany({
      where: { restaurantId },
      include: { user: true },
      orderBy: { assignedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      assignedAt: row.assignedAt,
      user: {
        id: row.user.id,
        email: row.user.email,
        name: row.user.name,
        role: row.user.role,
        resetPasswordExpires: row.user.resetPasswordExpires,
        isActive: row.user.isActive,
        createdAt: row.user.createdAt,
        updatedAt: row.user.updatedAt,
      },
    }));
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaUniqueViolation,
  uniqueConstraintFieldsFromMeta,
} from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import type { CreateRestaurantTableDto } from './dto/create-restaurant-table.dto.js';
import type { UpdateRestaurantTableDto } from './dto/update-restaurant-table.dto.js';
import { RestaurantScopeService } from './restaurant-scope.service.js';

export type RestaurantTableProfile = {
  id: string;
  restaurantId: string;
  tableNumber: string;
  seatCount: number;
  isActive: boolean;
  locationLabel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class RestaurantTablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: RestaurantScopeService,
  ) {}

  private toProfile(row: {
    id: string;
    restaurantId: string;
    tableNumber: string;
    seatCount: number;
    isActive: boolean;
    locationLabel: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): RestaurantTableProfile {
    return {
      id: row.id,
      restaurantId: row.restaurantId,
      tableNumber: row.tableNumber,
      seatCount: row.seatCount,
      isActive: row.isActive,
      locationLabel: row.locationLabel,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private handleUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('tableNumber') || fields.includes('restaurantId')) {
        throw new ConflictException(
          'A table with this number already exists for this restaurant',
        );
      }
      throw new ConflictException('Duplicate table record');
    }
    throw error;
  }

  async findPublicActive(
    restaurantId: string,
  ): Promise<RestaurantTableProfile[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant?.isActive) {
      throw new NotFoundException('Restaurant not found');
    }
    const rows = await this.prisma.restaurantTable.findMany({
      where: { restaurantId, isActive: true },
      orderBy: [{ tableNumber: 'asc' }],
    });
    return rows.map((r) => this.toProfile(r));
  }

  async findAllManaged(
    restaurantId: string,
    user: JwtUser,
  ): Promise<RestaurantTableProfile[]> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const rows = await this.prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: [{ tableNumber: 'asc' }],
    });
    return rows.map((r) => this.toProfile(r));
  }

  async create(
    restaurantId: string,
    dto: CreateRestaurantTableDto,
    user: JwtUser,
  ): Promise<RestaurantTableProfile> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    try {
      const created = await this.prisma.restaurantTable.create({
        data: {
          restaurantId,
          tableNumber: dto.tableNumber.trim(),
          seatCount: dto.seatCount,
          locationLabel: dto.locationLabel?.trim() || null,
          notes: dto.notes?.trim() || null,
          isActive: dto.isActive ?? true,
        },
      });
      return this.toProfile(created);
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async update(
    restaurantId: string,
    tableId: string,
    dto: UpdateRestaurantTableDto,
    user: JwtUser,
  ): Promise<RestaurantTableProfile> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    const existing = await this.prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!existing) {
      throw new NotFoundException('Table not found');
    }
    try {
      const updated = await this.prisma.restaurantTable.update({
        where: { id: tableId },
        data: {
          ...(dto.tableNumber !== undefined
            ? { tableNumber: dto.tableNumber.trim() }
            : {}),
          ...(dto.seatCount !== undefined ? { seatCount: dto.seatCount } : {}),
          ...(dto.locationLabel !== undefined
            ? { locationLabel: dto.locationLabel?.trim() ?? null }
            : {}),
          ...(dto.notes !== undefined
            ? { notes: dto.notes?.trim() ?? null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
      return this.toProfile(updated);
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async remove(
    restaurantId: string,
    tableId: string,
    user: JwtUser,
  ): Promise<{ message: string }> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    const existing = await this.prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!existing) {
      throw new NotFoundException('Table not found');
    }
    const count = await this.prisma.tableReservation.count({
      where: { tableId },
    });
    if (count > 0) {
      throw new ConflictException(
        'Cannot delete a table that has reservations; deactivate it instead',
      );
    }
    await this.prisma.restaurantTable.delete({ where: { id: tableId } });
    return { message: 'Table deleted' };
  }
}

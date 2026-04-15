import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TableReservationStatus } from '../../generated/prisma/enums.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTableReservationDto } from './dto/create-table-reservation.dto.js';
import type { ListTableReservationsQueryDto } from './dto/list-table-reservations-query.dto.js';
import type { ListMyReservationsQueryDto } from './dto/list-my-reservations-query.dto.js';
import { RestaurantScopeService } from './restaurant-scope.service.js';

export type TableReservationProfile = {
  id: string;
  restaurantId: string;
  tableId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  partySize: number;
  status: TableReservationStatus;
  createdAt: string;
  updatedAt: string;
  table: { id: string; tableNumber: string; seatCount: number };
  restaurant: { id: string; name: string };
  user?: { id: string; email: string; name: string };
};

@Injectable()
export class TableReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: RestaurantScopeService,
  ) {}

  /** Reservations that block the table for overlap checks and public occupancy. */
  private bookingsBlockStatuses(): TableReservationStatus[] {
    return [TableReservationStatus.PENDING, TableReservationStatus.CONFIRMED];
  }

  private async sweepExpiredReservations(
    db: Pick<PrismaService, 'tableReservation'> = this.prisma,
  ): Promise<void> {
    const now = new Date();
    await db.tableReservation.updateMany({
      where: {
        status: TableReservationStatus.CONFIRMED,
        endsAt: { lt: now },
      },
      data: { status: TableReservationStatus.COMPLETED },
    });
    await db.tableReservation.updateMany({
      where: {
        status: TableReservationStatus.PENDING,
        endsAt: { lt: now },
      },
      data: { status: TableReservationStatus.CANCELLED },
    });
  }

  private toProfile(
    r: {
      id: string;
      restaurantId: string;
      tableId: string;
      userId: string;
      startsAt: Date;
      endsAt: Date;
      partySize: number;
      status: TableReservationStatus;
      createdAt: Date;
      updatedAt: Date;
      table: { id: string; tableNumber: string; seatCount: number };
      restaurant: { id: string; name: string };
      user?: { id: string; email: string; name: string };
    },
    includeUser: boolean,
  ): TableReservationProfile {
    const base: TableReservationProfile = {
      id: r.id,
      restaurantId: r.restaurantId,
      tableId: r.tableId,
      userId: r.userId,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      partySize: r.partySize,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      table: r.table,
      restaurant: r.restaurant,
    };
    if (includeUser && r.user) {
      base.user = r.user;
    }
    return base;
  }

  async create(
    restaurantId: string,
    dto: CreateTableReservationDto,
    user: JwtUser,
  ): Promise<TableReservationProfile> {
    if (user.role !== Role.USER) {
      throw new ForbiddenException('Only customer accounts can book a table');
    }
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    const now = new Date();
    if (startsAt < now) {
      throw new BadRequestException('Reservation cannot start in the past');
    }

    return this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant?.isActive) {
        throw new NotFoundException('Restaurant not found');
      }

      await this.sweepExpiredReservations(tx);

      const table = await tx.restaurantTable.findFirst({
        where: {
          id: dto.tableId,
          restaurantId,
          isActive: true,
        },
      });
      if (!table) {
        throw new NotFoundException('Table not found or not available');
      }
      if (dto.partySize > table.seatCount) {
        throw new BadRequestException(
          `Party size cannot exceed table capacity (${table.seatCount})`,
        );
      }

      const overlap = await tx.tableReservation.findFirst({
        where: {
          tableId: table.id,
          status: { in: this.bookingsBlockStatuses() },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (overlap) {
        throw new ConflictException(
          'This table is already reserved for the selected time range',
        );
      }

      const created = await tx.tableReservation.create({
        data: {
          restaurantId,
          tableId: table.id,
          userId: user.userId,
          startsAt,
          endsAt,
          partySize: dto.partySize,
          status: TableReservationStatus.PENDING,
        },
        include: {
          table: { select: { id: true, tableNumber: true, seatCount: true } },
          restaurant: { select: { id: true, name: true } },
        },
      });
      return this.toProfile(created, false);
    });
  }

  async listMine(
    user: JwtUser,
    query: ListMyReservationsQueryDto,
  ): Promise<{
    data: TableReservationProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (user.role !== Role.USER) {
      throw new ForbiddenException('Insufficient role');
    }
    await this.sweepExpiredReservations();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { userId: user.userId };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.tableReservation.count({ where }),
      this.prisma.tableReservation.findMany({
        where,
        orderBy: { startsAt: 'desc' },
        skip,
        take: limit,
        include: {
          table: { select: { id: true, tableNumber: true, seatCount: true } },
          restaurant: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.toProfile(r, false)),
      total,
      page,
      limit,
    };
  }

  async cancel(
    reservationId: string,
    user: JwtUser,
  ): Promise<TableReservationProfile> {
    if (user.role !== Role.USER) {
      throw new ForbiddenException('Insufficient role');
    }
    const existing = await this.prisma.tableReservation.findFirst({
      where: { id: reservationId, userId: user.userId },
      include: {
        table: { select: { id: true, tableNumber: true, seatCount: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Reservation not found');
    }
    if (existing.status === TableReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }
    if (existing.status === TableReservationStatus.COMPLETED) {
      throw new BadRequestException('This reservation has already finished');
    }
    const now = new Date();
    if (existing.startsAt <= now) {
      throw new BadRequestException(
        'Cannot cancel a reservation that has already started',
      );
    }

    const updated = await this.prisma.tableReservation.update({
      where: { id: reservationId },
      data: { status: TableReservationStatus.CANCELLED },
      include: {
        table: { select: { id: true, tableNumber: true, seatCount: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });
    return this.toProfile(updated, false);
  }

  async listForRestaurant(
    restaurantId: string,
    query: ListTableReservationsQueryDto,
    user: JwtUser,
  ): Promise<TableReservationProfile[]> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    await this.sweepExpiredReservations();

    const where: {
      restaurantId: string;
      startsAt?: { gte?: Date; lte?: Date };
    } = { restaurantId };

    if (query.startsFrom) {
      const from = new Date(query.startsFrom);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException('Invalid startsFrom');
      }
      where.startsAt = { ...where.startsAt, gte: from };
    }
    if (query.startsTo) {
      const to = new Date(query.startsTo);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException('Invalid startsTo');
      }
      where.startsAt = { ...where.startsAt, lte: to };
    }

    const rows = await this.prisma.tableReservation.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      take: 500,
      include: {
        table: { select: { id: true, tableNumber: true, seatCount: true } },
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return rows.map((r) => this.toProfile(r, true));
  }

  async listOccupiedSlotsPublic(
    restaurantId: string,
    tableId: string,
    fromIso: string,
    toIso: string,
  ): Promise<{ slots: Array<{ startsAt: string; endsAt: string }> }> {
    await this.sweepExpiredReservations();
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from or to');
    }
    if (from >= to) {
      throw new BadRequestException('`to` must be after `from`');
    }
    /** Booking UI loads several calendar months; keep a generous cap to limit query size. */
    const maxMs = 1000 * 60 * 60 * 24 * 200;
    if (to.getTime() - from.getTime() > maxMs) {
      throw new BadRequestException('Requested window is too large');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant?.isActive) {
      throw new NotFoundException('Restaurant not found');
    }

    const table = await this.prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId, isActive: true },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const rows = await this.prisma.tableReservation.findMany({
      where: {
        tableId,
        status: { in: this.bookingsBlockStatuses() },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });
    return {
      slots: rows.map((r) => ({
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(),
      })),
    };
  }

  async confirmByRestaurantAdmin(
    restaurantId: string,
    reservationId: string,
    user: JwtUser,
  ): Promise<TableReservationProfile> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    await this.sweepExpiredReservations();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tableReservation.findFirst({
        where: { id: reservationId, restaurantId },
        include: {
          table: { select: { id: true, tableNumber: true, seatCount: true } },
          restaurant: { select: { id: true, name: true } },
        },
      });
      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }
      if (existing.status !== TableReservationStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be confirmed');
      }

      const overlap = await tx.tableReservation.findFirst({
        where: {
          tableId: existing.tableId,
          id: { not: reservationId },
          status: { in: this.bookingsBlockStatuses() },
          startsAt: { lt: existing.endsAt },
          endsAt: { gt: existing.startsAt },
        },
      });
      if (overlap) {
        throw new ConflictException(
          'This table is no longer available for that time range',
        );
      }

      const updated = await tx.tableReservation.update({
        where: { id: reservationId },
        data: { status: TableReservationStatus.CONFIRMED },
        include: {
          table: { select: { id: true, tableNumber: true, seatCount: true } },
          restaurant: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, name: true } },
        },
      });
      return this.toProfile(updated, true);
    });
  }

  async unconfirmByRestaurantAdmin(
    restaurantId: string,
    reservationId: string,
    user: JwtUser,
  ): Promise<TableReservationProfile> {
    await this.scope.assertAssignedRestaurantAdmin(restaurantId, user);
    await this.sweepExpiredReservations();

    const existing = await this.prisma.tableReservation.findFirst({
      where: { id: reservationId, restaurantId },
      include: {
        table: { select: { id: true, tableNumber: true, seatCount: true } },
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Reservation not found');
    }
    if (existing.status !== TableReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed reservations can be moved back to pending',
      );
    }
    const now = new Date();
    if (existing.startsAt <= now) {
      throw new BadRequestException(
        'Cannot unconfirm a reservation that has already started',
      );
    }

    const updated = await this.prisma.tableReservation.update({
      where: { id: reservationId },
      data: { status: TableReservationStatus.PENDING },
      include: {
        table: { select: { id: true, tableNumber: true, seatCount: true } },
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return this.toProfile(updated, true);
  }
}

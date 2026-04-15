import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/enums.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RestaurantScopeService } from './restaurant-scope.service.js';
import { TableReservationsService } from './table-reservations.service.js';

describe('TableReservationsService', () => {
  let service: TableReservationsService;
  const prisma = {
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    tableReservation: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const scope = {
    assertAssignedRestaurantAdmin: jest.fn(),
  };

  const user: JwtUser = {
    userId: 'u1',
    email: 'u@x.com',
    role: Role.USER,
  };

  const admin: JwtUser = {
    userId: 'a1',
    email: 'a@x.com',
    role: Role.ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableReservationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RestaurantScopeService, useValue: scope },
      ],
    }).compile();
    service = module.get(TableReservationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listMine', () => {
    it('rejects non-USER', async () => {
      await expect(service.listMine(admin, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns paginated data for USER', async () => {
      prisma.tableReservation.count.mockResolvedValue(2);
      prisma.tableReservation.findMany.mockResolvedValue([]);
      const out = await service.listMine(user, { page: 1, limit: 10 });
      expect(out.total).toBe(2);
      expect(out.data).toEqual([]);
      expect(out.page).toBe(1);
      expect(out.limit).toBe(10);
    });
  });
});

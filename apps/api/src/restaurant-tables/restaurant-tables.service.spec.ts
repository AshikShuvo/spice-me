import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/enums.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RestaurantScopeService } from './restaurant-scope.service.js';
import { RestaurantTablesService } from './restaurant-tables.service.js';

describe('RestaurantTablesService', () => {
  let service: RestaurantTablesService;
  const prisma = {
    restaurant: { findUnique: jest.fn() },
    restaurantTable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tableReservation: { count: jest.fn() },
    restaurantAdminAssignment: { findFirst: jest.fn() },
  };

  const scope = {
    assertAssignedRestaurantAdmin: jest.fn(),
  };

  const restaurantAdminUser: JwtUser = {
    userId: 'ra1',
    email: 'ra@x.com',
    role: Role.RESTAURANT_ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantTablesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RestaurantScopeService, useValue: scope },
      ],
    }).compile();
    service = module.get(RestaurantTablesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPublicActive', () => {
    it('throws when restaurant missing', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.findPublicActive('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when restaurant inactive', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        isActive: false,
      });
      await expect(service.findPublicActive('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns active tables', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        isActive: true,
      });
      const row = {
        id: 't1',
        restaurantId: 'r1',
        tableNumber: '1',
        seatCount: 4,
        isActive: true,
        locationLabel: null,
        notes: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      prisma.restaurantTable.findMany.mockResolvedValue([row]);
      const out = await service.findPublicActive('r1');
      expect(out).toHaveLength(1);
      expect(out[0].tableNumber).toBe('1');
    });
  });

  describe('remove', () => {
    it('throws Conflict when reservations exist', async () => {
      scope.assertAssignedRestaurantAdmin.mockResolvedValue(undefined);
      prisma.restaurantTable.findFirst.mockResolvedValue({
        id: 't1',
        restaurantId: 'r1',
      });
      prisma.tableReservation.count.mockResolvedValue(1);
      await expect(
        service.remove('r1', 't1', restaurantAdminUser),
      ).rejects.toThrow(ConflictException);
    });
  });
});

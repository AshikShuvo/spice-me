import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RestaurantsService } from './restaurants.service.js';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  const prisma = {
    restaurant: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    restaurantAdminAssignment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const baseRestaurant = {
    id: 'r1',
    name: 'Spice',
    code: 'RQ0001',
    address: '1 Main St',
    latitude: 59.9,
    longitude: 10.7,
    timezone: 'Europe/Oslo',
    openingTime: '07:00',
    closingTime: '20:00',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminJwt = {
    userId: 'admin1',
    email: 'a@a.com',
    role: Role.ADMIN,
  };

  const raJwt = {
    userId: 'ra1',
    email: 'ra@a.com',
    role: Role.RESTAURANT_ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        return fn(prisma);
      },
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RestaurantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('generates RQ0001 when no restaurants exist', async () => {
      prisma.restaurant.findFirst.mockResolvedValue(null);
      prisma.restaurant.create.mockResolvedValue(baseRestaurant);
      const out = await service.create({
        name: 'Spice',
        address: '1 Main St',
        latitude: 59.9,
        longitude: 10.7,
        timezone: 'Europe/Oslo',
        openingTime: '07:00',
        closingTime: '20:00',
      });
      expect(out.code).toBe('RQ0001');
      expect(prisma.restaurant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'RQ0001' }),
        }),
      );
    });

    it('generates RQ0002 when last code is RQ0001', async () => {
      prisma.restaurant.findFirst.mockResolvedValue({ code: 'RQ0001' });
      prisma.restaurant.create.mockResolvedValue({
        ...baseRestaurant,
        code: 'RQ0002',
      });
      const out = await service.create({
        name: 'B',
        address: '2 Main St',
        latitude: 59.9,
        longitude: 10.7,
        timezone: 'Europe/Oslo',
        openingTime: '08:00',
        closingTime: '21:00',
      });
      expect(out.code).toBe('RQ0002');
    });

    it('throws when code would exceed RQ1000', async () => {
      prisma.restaurant.findFirst.mockResolvedValue({ code: 'RQ1000' });
      await expect(
        service.create({
          name: 'X',
          address: 'Addr here ok',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          openingTime: '00:00',
          closingTime: '23:59',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when name unique constraint fails (P2002)', async () => {
      prisma.restaurant.findFirst.mockResolvedValue(null);
      prisma.restaurant.create.mockRejectedValue({
        code: 'P2002',
        meta: { modelName: 'Restaurant', target: ['name'] },
      });
      await expect(
        service.create({
          name: 'Dup',
          address: '1 Main St',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          openingTime: '01:00',
          closingTime: '02:00',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated list', async () => {
      prisma.restaurant.findMany.mockResolvedValue([baseRestaurant]);
      prisma.restaurant.count.mockResolvedValue(1);
      const out = await service.findAll({ page: 1, limit: 20 });
      expect(out.total).toBe(1);
      expect(out.data).toHaveLength(1);
      expect(out.page).toBe(1);
      expect(out.limit).toBe(20);
    });
  });

  describe('findDefault', () => {
    it('returns restaurant when default active exists', async () => {
      prisma.restaurant.findFirst.mockResolvedValue({
        ...baseRestaurant,
        isDefault: true,
      });
      const out = await service.findDefault();
      expect(out.isDefault).toBe(true);
    });

    it('throws when none found', async () => {
      prisma.restaurant.findFirst.mockResolvedValue(null);
      await expect(service.findDefault()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyRestaurants', () => {
    it('returns restaurants from assignments', async () => {
      prisma.restaurantAdminAssignment.findMany.mockResolvedValue([
        { restaurant: baseRestaurant, userId: 'ra1', id: 'a1' },
      ]);
      const out = await service.findMyRestaurants('ra1');
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe('r1');
    });
  });

  describe('findOne', () => {
    it('ADMIN returns any restaurant', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      const out = await service.findOne('r1', adminJwt);
      expect(out.id).toBe('r1');
    });

    it('RESTAURANT_ADMIN with assignment returns restaurant', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({ id: 'x' });
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      const out = await service.findOne('r1', raJwt);
      expect(out.id).toBe('r1');
    });

    it('RESTAURANT_ADMIN without assignment throws Forbidden', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue(null);
      await expect(service.findOne('r1', raJwt)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('USER throws Forbidden', async () => {
      await expect(
        service.findOne('r1', {
          userId: 'u1',
          email: 'u@u.com',
          role: Role.USER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('partial update', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.restaurant.update.mockResolvedValue({
        ...baseRestaurant,
        name: 'New',
      });
      const out = await service.update('r1', { name: 'New' });
      expect(out.name).toBe('New');
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { name: 'New' },
      });
    });

    it('throws ConflictException when rename hits existing name (P2002)', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.restaurant.update.mockRejectedValue({
        code: 'P2002',
        meta: {
          modelName: 'Restaurant',
          driverAdapterError: {
            cause: { constraint: { fields: ['name'] } },
          },
        },
      });
      await expect(service.update('r1', { name: 'Taken' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    it('sets isActive', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.restaurant.update.mockResolvedValue({
        ...baseRestaurant,
        isActive: false,
      });
      const out = await service.updateStatus('r1', false);
      expect(out.isActive).toBe(false);
    });
  });

  describe('setDefault', () => {
    it('runs updateMany then update in transaction', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.restaurant.updateMany.mockResolvedValue({ count: 3 });
      prisma.restaurant.update.mockResolvedValue({
        ...baseRestaurant,
        isDefault: true,
      });
      await service.setDefault('r1');
      expect(prisma.restaurant.updateMany).toHaveBeenCalledWith({
        data: { isDefault: false },
      });
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { isDefault: true },
      });
    });

    it('throws when restaurant missing', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.setDefault('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignAdmin', () => {
    it('throws when restaurant not found', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.assignAdmin('r1', { userId: 'u1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when user not found', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.assignAdmin('r1', { userId: 'u1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when user is not RESTAURANT_ADMIN', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: Role.USER,
      });
      await expect(service.assignAdmin('r1', { userId: 'u1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls createMany with skipDuplicates', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: Role.RESTAURANT_ADMIN,
      });
      prisma.restaurantAdminAssignment.createMany.mockResolvedValue({
        count: 1,
      });
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'as1',
        restaurantId: 'r1',
        userId: 'u1',
      });
      await service.assignAdmin('r1', { userId: 'u1' });
      expect(prisma.restaurantAdminAssignment.createMany).toHaveBeenCalledWith({
        data: [{ restaurantId: 'r1', userId: 'u1' }],
        skipDuplicates: true,
      });
    });
  });

  describe('removeAdmin', () => {
    it('deletes assignment', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'as1',
      });
      prisma.restaurantAdminAssignment.delete.mockResolvedValue({});
      const out = await service.removeAdmin('r1', 'u1');
      expect(out.message).toContain('removed');
      expect(prisma.restaurantAdminAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'as1' },
      });
    });

    it('throws when assignment missing', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue(null);
      await expect(service.removeAdmin('r1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActiveForBrowse', () => {
    it('returns id, name, code for active restaurants ordered by name', async () => {
      prisma.restaurant.findMany.mockResolvedValue([
        { id: 'a', name: 'Alpha', code: 'RQ0001' },
      ]);
      const out = await service.findActiveForBrowse();
      expect(out).toEqual([{ id: 'a', name: 'Alpha', code: 'RQ0001' }]);
      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('listAdmins', () => {
    it('returns users without password or refreshToken', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(baseRestaurant);
      prisma.restaurantAdminAssignment.findMany.mockResolvedValue([
        {
          id: 'as1',
          assignedAt: new Date(),
          user: {
            id: 'u1',
            email: 'x@x.com',
            name: 'X',
            role: Role.RESTAURANT_ADMIN,
            password: 'secret',
            refreshToken: 'rt',
            resetPasswordExpires: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ]);
      const out = await service.listAdmins('r1');
      expect(out).toHaveLength(1);
      expect(out[0].user).not.toHaveProperty('password');
      expect(out[0].user).not.toHaveProperty('refreshToken');
      expect(out[0].user.email).toBe('x@x.com');
    });
  });
});

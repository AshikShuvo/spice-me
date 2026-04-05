import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

/** Jest 30 `@jest/globals` types `jest.fn()` as `Mock<UnknownFunction>`, which breaks `mockResolvedValue` inference; use loose mocks in tests. */
type UsersPrismaMock = {
  user: {
    findUnique: ReturnType<typeof jest.fn>;
    findMany: ReturnType<typeof jest.fn>;
    count: ReturnType<typeof jest.fn>;
    create: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
  };
  restaurantAdminAssignment: {
    deleteMany: ReturnType<typeof jest.fn>;
  };
  $transaction: ReturnType<typeof jest.fn>;
};

/** Transaction callback receives a client without `$transaction`. */
type UsersPrismaTx = Pick<
  UsersPrismaMock,
  'user' | 'restaurantAdminAssignment'
>;

describe('UsersService', () => {
  let service: UsersService;
  let prisma: UsersPrismaMock;

  const baseUser = {
    id: 'u1',
    email: 'a@b.com',
    name: 'A',
    password: 'hash',
    role: Role.USER,
    refreshToken: null as string | null,
    resetPasswordToken: null as string | null,
    resetPasswordExpires: null as Date | null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      restaurantAdminAssignment: {
        deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (fn: (tx: UsersPrismaTx) => Promise<unknown>) => {
        return fn({
          user: prisma.user,
          restaurantAdminAssignment: prisma.restaurantAdminAssignment,
        });
      },
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);
      const out = await service.findAll({ page: 1, limit: 20 });
      expect(out.total).toBe(1);
      expect(out.data).toHaveLength(1);
      expect(out.data[0].email).toBe('a@b.com');
      expect(out.data[0]).not.toHaveProperty('password');
    });
  });

  describe('findMe', () => {
    it('returns profile', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const out = await service.findMe('u1');
      expect(out.id).toBe('u1');
      expect(out).not.toHaveProperty('password');
    });

    it('throws when missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findMe('x')).rejects.toThrow('User not found');
    });
  });

  describe('createRestaurantAdmin', () => {
    it('creates RESTAURANT_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        role: Role.RESTAURANT_ADMIN,
      });
      const out = await service.createRestaurantAdmin({
        name: 'RA',
        email: 'ra@x.com',
        password: 'Abcd1234',
      });
      expect(out.role).toBe(Role.RESTAURANT_ADMIN);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: Role.RESTAURANT_ADMIN,
            email: 'ra@x.com',
          }),
        }),
      );
      const call = prisma.user.create.mock.calls[0][0];
      expect(call.data.password).not.toBe('Abcd1234');
    });

    it('throws on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.createRestaurantAdmin({
          name: 'RA',
          email: 'a@b.com',
          password: 'Abcd1234',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('createAdmin', () => {
    it('creates admin', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...baseUser, role: Role.ADMIN });
      const out = await service.createAdmin({
        name: 'Admin',
        email: 'adm@x.com',
        password: 'Abcd1234',
      });
      expect(out.role).toBe(Role.ADMIN);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: Role.ADMIN,
            email: 'adm@x.com',
          }),
        }),
      );
      const call = prisma.user.create.mock.calls[0][0];
      expect(call.data.password).not.toBe('Abcd1234');
      expect(typeof call.data.password).toBe('string');
    });
  });

  describe('updateRole', () => {
    it('updates role', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, role: Role.ADMIN });
      const out = await service.updateRole('u1', { role: Role.ADMIN });
      expect(out.role).toBe(Role.ADMIN);
    });
  });

  describe('softDelete', () => {
    it('sets inactive for USER without deleting assignments', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, isActive: false });
      const out = await service.softDelete('u1');
      expect(out.message).toContain('deactivated');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: false, refreshToken: null },
      });
      expect(
        prisma.restaurantAdminAssignment.deleteMany,
      ).not.toHaveBeenCalled();
    });

    it('deletes assignments for RESTAURANT_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: Role.RESTAURANT_ADMIN,
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        role: Role.RESTAURANT_ADMIN,
        isActive: false,
      });
      await service.softDelete('u1');
      expect(prisma.restaurantAdminAssignment.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: false, refreshToken: null },
      });
    });
  });
});

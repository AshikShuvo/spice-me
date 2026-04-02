import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let usersService: { toProfile: jest.Mock };

  const profile = {
    id: 'u1',
    email: 'a@b.com',
    name: 'A',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    resetPasswordExpires: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : undefined)),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        throw new Error(`unexpected ${key}`);
      }),
    };
    usersService = {
      toProfile: jest.fn().mockReturnValue(profile),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates user and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const created = {
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        password: 'hashed',
        role: Role.USER,
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(created);
      prisma.user.update.mockResolvedValue(created);

      jwtService.signAsync
        .mockResolvedValueOnce('access.jwt')
        .mockResolvedValueOnce('refresh.jwt');

      const result = await service.register({
        name: 'A',
        email: 'A@b.com',
        password: 'Abcd1234',
      });

      expect(result.accessToken).toBe('access.jwt');
      expect(result.refreshToken).toBe('refresh.jwt');
      expect(result.user).toEqual(profile);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('throws on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'x' });
      await expect(
        service.register({
          name: 'A',
          email: 'a@b.com',
          password: 'Abcd1234',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('returns tokens for valid user', async () => {
      const passwordHash = await bcrypt.hash('Abcd1234', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: passwordHash,
        role: Role.USER,
        isActive: true,
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        name: 'A',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync
        .mockResolvedValueOnce('a')
        .mockResolvedValueOnce('r');
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'a@b.com',
        password: 'Abcd1234',
      });
      expect(result.accessToken).toBe('a');
    });

    it('throws for wrong password', async () => {
      const passwordHash = await bcrypt.hash('Abcd1234', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: passwordHash,
        role: Role.USER,
        isActive: true,
        name: 'A',
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('throws for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: 'stored',
        role: Role.USER,
        isActive: false,
        name: 'A',
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'Abcd1234' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshTokens', () => {
    it('returns new tokens when refresh matches', async () => {
      const plainRefresh = 'my-refresh-jwt-string';
      const refreshHash = await bcrypt.hash(plainRefresh, 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        refreshToken: refreshHash,
        role: Role.USER,
        isActive: true,
        password: 'p',
        name: 'A',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync
        .mockResolvedValueOnce('na')
        .mockResolvedValueOnce('nr');
      prisma.user.update.mockResolvedValue({});

      const out = await service.refreshTokens('u1', plainRefresh);
      expect(out.accessToken).toBe('na');
      expect(out.refreshToken).toBe('nr');
    });

    it('throws when no stored refresh', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        refreshToken: null,
        isActive: true,
        email: 'a@b.com',
        role: Role.USER,
        password: 'p',
        name: 'A',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.refreshTokens('u1', 't')).rejects.toThrow(
        'Access denied',
      );
    });

    it('throws when bcrypt compare fails', async () => {
      const refreshHash = await bcrypt.hash('correct', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        refreshToken: refreshHash,
        role: Role.USER,
        isActive: true,
        password: 'p',
        name: 'A',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.refreshTokens('u1', 'wrong-token')).rejects.toThrow(
        'Access denied',
      );
    });
  });

  describe('logout', () => {
    it('clears refresh token', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });
      const out = await service.logout('u1');
      expect(out.message).toBe('Logged out');
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { refreshToken: null },
      });
    });
  });

  describe('forgotPassword', () => {
    it('returns message without token when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const out = await service.forgotPassword({ email: 'x@y.com' });
      expect(out.message).toContain('If an account exists');
      expect(out.resetToken).toBeUndefined();
    });

    it('stores hash and returns resetToken in non-production', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        isActive: true,
        password: 'p',
        name: 'A',
        role: Role.USER,
        refreshToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.user.update.mockResolvedValue({});
      const out = await service.forgotPassword({ email: 'a@b.com' });
      expect(out.resetToken).toBeDefined();
      expect(typeof out.resetToken).toBe('string');
    });
  });

  describe('resetPassword', () => {
    it('throws when no candidate matches', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await expect(
        service.resetPassword({ token: 't', newPassword: 'Abcd1234' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('updates password when token matches', async () => {
      const plain = 'reset-plain-token';
      const tokenHash = await bcrypt.hash(plain, 4);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          resetPasswordToken: tokenHash,
          resetPasswordExpires: new Date(Date.now() + 60000),
          email: 'a@b.com',
          password: 'old',
          name: 'A',
          role: Role.USER,
          isActive: true,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      prisma.user.update.mockResolvedValue({});
      const out = await service.resetPassword({
        token: plain,
        newPassword: 'Abcd1234',
      });
      expect(out.message).toContain('reset');
    });
  });
});

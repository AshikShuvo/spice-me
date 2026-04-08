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
import { ProductsService } from '../products/products.service.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { RestaurantProductsService } from './restaurant-products.service.js';

describe('RestaurantProductsService', () => {
  let service: RestaurantProductsService;
  const prisma = {
    restaurant: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
    restaurantProduct: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    restaurantAdminAssignment: { findFirst: jest.fn() },
  };

  const profileTimestamps = {
    createdAt: new Date('2023-05-05T00:00:00.000Z'),
    updatedAt: new Date('2023-05-05T00:00:00.000Z'),
  };

  const toProfile = jest.fn((p: { id: string }) => ({
    id: p.id,
    title: 'T',
    description: '1234567890ab',
    imageUrl: 'u',
    categoryId: 'c1',
    subCategoryId: null,
    isPublished: true,
    isActive: true,
    category: { id: 'c1', name: 'Cat' },
    subCategory: null,
    pricing: {
      hasVariants: false,
      regularPrice: '10',
      offerPrice: null,
      display: { regularPrice: '10', offerPrice: null },
      variants: [],
    },
    allergyItems: [],
    ...profileTimestamps,
  }));

  const productsService = { toProfile };

  const raUser: JwtUser = {
    userId: 'ra1',
    email: 'ra@x.com',
    role: Role.RESTAURANT_ADMIN,
  };

  const linkTimestamps = {
    addedAt: new Date('2024-06-01T12:00:00.000Z'),
    updatedAt: new Date('2024-06-01T12:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();
    service = module.get(RestaurantProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAvailable', () => {
    it('throws when restaurant missing', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.findAvailable('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('maps products through toProfile', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.restaurantProduct.findMany.mockResolvedValue([
        {
          product: { id: 'p1' },
        },
      ]);
      const out = await service.findAvailable('r1');
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe('p1');
      expect(toProfile).toHaveBeenCalledWith({ id: 'p1' });
    });
  });

  describe('addProduct', () => {
    it('throws Forbidden when not assigned', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue(null);
      await expect(
        service.addProduct('r1', { productId: 'p1' }, raUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when restaurant missing', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(
        service.addProduct('r1', { productId: 'p1' }, raUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when product missing', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addProduct('r1', { productId: 'p1' }, raUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when product not published', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        isPublished: false,
      });
      await expect(
        service.addProduct('r1', { productId: 'p1' }, raUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates link', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        isPublished: true,
      });
      const link = {
        id: 'rp1',
        restaurantId: 'r1',
        productId: 'p1',
        isAvailable: true,
        ...linkTimestamps,
        product: { id: 'p1' },
      };
      prisma.restaurantProduct.create.mockResolvedValue(link);
      const out = await service.addProduct('r1', { productId: 'p1' }, raUser);
      expect(out).toEqual({
        id: 'rp1',
        restaurantId: 'r1',
        productId: 'p1',
        isAvailable: true,
        addedAt: linkTimestamps.addedAt.toISOString(),
        updatedAt: linkTimestamps.updatedAt.toISOString(),
        product: {
          id: 'p1',
          title: 'T',
          description: '1234567890ab',
          imageUrl: 'u',
          categoryId: 'c1',
          subCategoryId: null,
          isPublished: true,
          isActive: true,
          category: { id: 'c1', name: 'Cat' },
          subCategory: null,
          pricing: {
            hasVariants: false,
            regularPrice: '10',
            offerPrice: null,
            display: { regularPrice: '10', offerPrice: null },
            variants: [],
          },
          allergyItems: [],
          ...profileTimestamps,
        },
      });
    });

    it('throws ConflictException on P2002', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        isPublished: true,
      });
      prisma.restaurantProduct.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['restaurantId', 'productId'] },
      });
      await expect(
        service.addProduct('r1', { productId: 'p1' }, raUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateAvailability', () => {
    it('throws Forbidden when not assigned', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue(null);
      await expect(
        service.updateAvailability('r1', 'p1', { isAvailable: false }, raUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when link missing', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurantProduct.findFirst.mockResolvedValue(null);
      await expect(
        service.updateAvailability('r1', 'p1', { isAvailable: false }, raUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurantProduct.findFirst.mockResolvedValue({
        id: 'rp1',
        restaurantId: 'r1',
        productId: 'p1',
      });
      prisma.restaurantProduct.update.mockResolvedValue({
        id: 'rp1',
        restaurantId: 'r1',
        productId: 'p1',
        isAvailable: false,
        ...linkTimestamps,
        product: { id: 'p1' },
      });
      const out = await service.updateAvailability(
        'r1',
        'p1',
        { isAvailable: false },
        raUser,
      );
      expect(out.isAvailable).toBe(false);
      expect(out.addedAt).toBe(linkTimestamps.addedAt.toISOString());
    });
  });

  describe('removeProduct', () => {
    it('throws when link missing', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurantProduct.findFirst.mockResolvedValue(null);
      await expect(service.removeProduct('r1', 'p1', raUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes', async () => {
      prisma.restaurantAdminAssignment.findFirst.mockResolvedValue({
        id: 'a1',
      });
      prisma.restaurantProduct.findFirst.mockResolvedValue({ id: 'rp1' });
      prisma.restaurantProduct.delete.mockResolvedValue({});
      const out = await service.removeProduct('r1', 'p1', raUser);
      expect(out.message).toContain('removed');
    });
  });
});

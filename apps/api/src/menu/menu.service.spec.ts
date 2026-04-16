import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from '../products/products.service.js';
import { MenuService } from './menu.service.js';

describe('MenuService', () => {
  let service: MenuService;

  const toProfile = jest.fn();
  const prisma = {
    product: { findMany: jest.fn() },
    restaurant: { findUnique: jest.fn() },
    restaurantProduct: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
  };

  const rawProduct = {
    id: 'p1',
    title: 'Item',
    description: 'Desc',
    imageUrl: 'https://x',
    categoryId: 'cat1',
    subCategoryId: null as string | null,
    isPublished: true,
    isActive: true,
    isVatExclusive: false,
    regularPrice: { toString: () => '10.00' },
    offerPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat1', name: 'Food' },
    subCategory: null,
    variants: [] as unknown[],
    allergyItems: [] as unknown[],
  };

  const profile = {
    id: 'p1',
    title: 'Item',
    description: 'Desc',
    imageUrl: 'https://x',
    categoryId: 'cat1',
    subCategoryId: null,
    isPublished: true,
    isActive: true,
    isVatExclusive: false,
    category: { id: 'cat1', name: 'Food' },
    subCategory: null,
    pricing: {
      hasVariants: false,
      regularPrice: '10.00',
      offerPrice: null,
      display: { regularPrice: '10.00', offerPrice: null },
      variants: [],
    },
    allergyItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const platformSettings = {
    getOrCreate: jest.fn().mockResolvedValue({
      foodVatPercent: '0',
      currencyCode: 'EUR',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    toProfile.mockImplementation((p: { id: string }) => ({
      ...profile,
      id: p.id,
      categoryId: p.categoryId,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProductsService, useValue: { toProfile } },
        { provide: PlatformSettingsService, useValue: platformSettings },
      ],
    }).compile();
    service = module.get(MenuService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMenu global', () => {
    it('returns categories and products for global catalog', async () => {
      prisma.product.findMany.mockResolvedValue([rawProduct]);
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat1',
          name: 'Food',
          sortOrder: 0,
          subCategories: [{ id: 'sub1', name: 'Sides', sortOrder: 0 }],
        },
      ]);

      const out = await service.getMenu();

      expect(out.scope).toBe('global');
      expect(out.restaurant).toBeNull();
      expect(out.categories).toHaveLength(1);
      expect(out.categories[0].subCategories).toHaveLength(1);
      expect(out.products).toHaveLength(1);
      expect(out.currencyCode).toBe('EUR');
      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
    });

    it('returns empty when no products', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      const out = await service.getMenu();
      expect(out.categories).toEqual([]);
      expect(out.products).toEqual([]);
      expect(out.currencyCode).toBe('EUR');
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getMenu restaurant', () => {
    it('returns 404 when restaurant missing', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.getMenu('RQ9999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns 404 when restaurant inactive', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        name: 'X',
        code: 'RQ0001',
        isActive: false,
      });
      await expect(service.getMenu('RQ0001')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns restaurant scope and linked products', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        name: 'Cafe',
        code: 'RQ0001',
        isActive: true,
      });
      prisma.restaurantProduct.findMany.mockResolvedValue([
        { product: rawProduct },
      ]);
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat1',
          name: 'Food',
          sortOrder: 0,
          subCategories: [],
        },
      ]);

      const out = await service.getMenu('RQ0001');

      expect(out.scope).toBe('restaurant');
      expect(out.restaurant).toEqual({
        id: 'r1',
        name: 'Cafe',
        code: 'RQ0001',
      });
      expect(out.products).toHaveLength(1);
      expect(out.currencyCode).toBe('EUR');
      expect(prisma.restaurantProduct.findMany).toHaveBeenCalled();
    });

    it('trims restaurant code', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        name: 'Cafe',
        code: 'RQ0001',
        isActive: true,
      });
      prisma.restaurantProduct.findMany.mockResolvedValue([]);
      const out = await service.getMenu('  RQ0001  ');
      expect(out.scope).toBe('restaurant');
      expect(out.currencyCode).toBe('EUR');
      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { code: 'RQ0001' },
      });
    });
  });

  describe('filters inactive categories', () => {
    it('drops products whose category is inactive', async () => {
      prisma.product.findMany.mockResolvedValue([rawProduct]);
      prisma.category.findMany.mockResolvedValue([]);

      const out = await service.getMenu();
      expect(out.categories).toEqual([]);
      expect(out.products).toEqual([]);
      expect(out.currencyCode).toBe('EUR');
    });
  });
});

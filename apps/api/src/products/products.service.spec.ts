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
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ProductsService,
  type ProductWithRelations,
} from './products.service.js';

const d = (s: string) => ({ toString: () => s });

describe('ProductsService', () => {
  let service: ProductsService;
  const prisma = {
    category: { findUnique: jest.fn() },
    subCategory: { findUnique: jest.fn() },
    product: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productVariant: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productAllergyItem: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    allergyItem: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const baseRelations = (
    overrides: Partial<ProductWithRelations> = {},
  ): ProductWithRelations => ({
    id: 'p1',
    title: 'Spicy Chicken',
    description: 'A tasty pizza description here',
    imageUrl: 'https://x/img.jpg',
    categoryId: 'c1',
    subCategoryId: null,
    isPublished: false,
    isActive: true,
    regularPrice: d('12.00'),
    offerPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'c1', name: 'Pizza' },
    subCategory: null,
    variants: [],
    allergyItems: [],
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.productVariant.findMany.mockResolvedValue([]);
    prisma.productVariant.updateMany.mockResolvedValue({ count: 0 });
    prisma.$transaction.mockImplementation(async (ops: unknown[]) =>
      Promise.all(ops),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toProfile', () => {
    it('hasVariants false uses product regularPrice for envelope and display', () => {
      const p = baseRelations();
      const profile = service.toProfile(p);
      expect(profile.pricing.hasVariants).toBe(false);
      expect(profile.pricing.regularPrice).toBe('12.00');
      expect(profile.pricing.display.regularPrice).toBe('12.00');
      expect(profile.pricing.display.offerPrice).toBeNull();
      expect(profile.pricing.variants).toHaveLength(0);
    });

    it('hasVariants true nulls product-level prices; display uses default variant', () => {
      const p = baseRelations({
        regularPrice: d('99'),
        variants: [
          {
            id: 'v1',
            name: 'L',
            sortOrder: 0,
            regularPrice: d('15'),
            offerPrice: null,
            isActive: true,
            isDefault: true,
          },
        ],
      });
      const profile = service.toProfile(p);
      expect(profile.pricing.hasVariants).toBe(true);
      expect(profile.pricing.regularPrice).toBeNull();
      expect(profile.pricing.offerPrice).toBeNull();
      expect(profile.pricing.display.regularPrice).toBe('15');
      expect(profile.pricing.variants[0].regularPrice).toBe('15');
      expect(profile.pricing.variants[0].isDefault).toBe(true);
    });
  });

  describe('create', () => {
    it('creates when category exists', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      const created = baseRelations();
      prisma.product.create.mockResolvedValue(created);
      const out = await service.create({
        title: 'T',
        description: '1234567890ab',
        imageUrl: 'u',
        categoryId: 'c1',
        regularPrice: 12,
      });
      expect(out.id).toBe('p1');
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('throws when category missing', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          title: 'T',
          description: '1234567890ab',
          imageUrl: 'u',
          categoryId: 'c1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when offerPrice >= regularPrice', async () => {
      await expect(
        service.create({
          title: 'T',
          description: '1234567890ab',
          imageUrl: 'u',
          categoryId: 'c1',
          regularPrice: 10,
          offerPrice: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when subcategory wrong category', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.subCategory.findUnique.mockResolvedValue({
        id: 's1',
        categoryId: 'other',
      });
      await expect(
        service.create({
          title: 'T',
          description: '1234567890ab',
          imageUrl: 'u',
          categoryId: 'c1',
          subCategoryId: 's1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('public view filters published and active', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);
      await service.findAll({}, false);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            isActive: true,
          }),
        }),
      );
    });

    it('admin view omits published filter', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);
      await service.findAll({}, true);
      const arg = prisma.product.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(arg.where.isPublished).toBeUndefined();
      expect(arg.where.isActive).toBeUndefined();
    });

    it('applies categoryId filter', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);
      await service.findAll({ categoryId: 'c1' }, false);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'c1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('admin sees unpublished', async () => {
      prisma.product.findUnique.mockResolvedValue(
        baseRelations({ isPublished: false }),
      );
      const out = await service.findOne('p1', true);
      expect(out.isPublished).toBe(false);
    });

    it('public 404 for unpublished', async () => {
      prisma.product.findUnique.mockResolvedValue(
        baseRelations({ isPublished: false }),
      );
      await expect(service.findOne('p1', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws when product missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { title: 'N' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when new category missing', async () => {
      prisma.product.findUnique.mockResolvedValue(
        baseRelations({ categoryId: 'c1' }),
      );
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update('p1', { categoryId: 'new' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      const updated = baseRelations({ title: 'New' });
      prisma.product.update.mockResolvedValue(updated);
      const out = await service.update('p1', { title: 'New' });
      expect(out.title).toBe('New');
    });

    it('throws when offerPrice >= regularPrice', async () => {
      await expect(
        service.update('p1', { regularPrice: 5, offerPrice: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('allows publish with product regularPrice', async () => {
      const row = baseRelations({
        regularPrice: d('10'),
        isActive: true,
        variants: [],
      });
      prisma.product.findUnique
        .mockResolvedValueOnce(row)
        .mockResolvedValueOnce(row);
      prisma.product.update.mockResolvedValue(
        baseRelations({ isPublished: true, regularPrice: d('10') }),
      );
      const out = await service.publish('p1', { isPublished: true });
      expect(out.isPublished).toBe(true);
      expect(prisma.product.findUnique).toHaveBeenCalledTimes(2);
    });

    it('allows publish with active variant and default set', async () => {
      const variantBefore = {
        id: 'v1',
        name: 'S',
        sortOrder: 0,
        regularPrice: d('5'),
        offerPrice: null,
        isActive: true,
        isDefault: false,
      };
      const variantAfter = { ...variantBefore, isDefault: true };
      prisma.product.findUnique
        .mockResolvedValueOnce(
          baseRelations({
            regularPrice: null,
            variants: [variantBefore],
            isActive: true,
          }),
        )
        .mockResolvedValueOnce(
          baseRelations({
            regularPrice: null,
            variants: [variantAfter],
            isActive: true,
          }),
        );
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v1',
          productId: 'p1',
          name: 'S',
          sortOrder: 0,
          regularPrice: d('5'),
          offerPrice: null,
          isActive: true,
          isDefault: false,
        },
      ]);
      prisma.product.update.mockResolvedValue(
        baseRelations({
          isPublished: true,
          regularPrice: null,
          variants: [variantAfter],
        }),
      );
      const out = await service.publish('p1', { isPublished: true });
      expect(out.isPublished).toBe(true);
    });

    it('rejects publish without price or variant', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce(
          baseRelations({ regularPrice: null, variants: [], isActive: true }),
        )
        .mockResolvedValueOnce(
          baseRelations({ regularPrice: null, variants: [], isActive: true }),
        );
      await expect(
        service.publish('p1', { isPublished: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects publish when inactive', async () => {
      prisma.product.findUnique.mockResolvedValue(
        baseRelations({ isActive: false, regularPrice: d('1'), variants: [] }),
      );
      await expect(
        service.publish('p1', { isPublished: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('unpublishes without any price check', async () => {
      prisma.product.findUnique.mockResolvedValue(
        baseRelations({
          isActive: true,
          isPublished: true,
          regularPrice: null,
          variants: [],
        }),
      );
      prisma.product.update.mockResolvedValue(
        baseRelations({ isPublished: false, regularPrice: null }),
      );
      const out = await service.publish('p1', { isPublished: false });
      expect(out.isPublished).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('sets inactive and unpublished', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.product.update.mockResolvedValue({});
      const out = await service.softDelete('p1');
      expect(out.message).toContain('deleted');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isActive: false, isPublished: false },
      });
    });
  });

  describe('addVariant', () => {
    it('runs transaction and returns product', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.productVariant.create.mockResolvedValue({});
      prisma.product.update.mockResolvedValue({});
      const full = baseRelations({
        regularPrice: null,
        variants: [
          {
            id: 'v1',
            name: 'L',
            sortOrder: 0,
            regularPrice: d('10'),
            offerPrice: null,
            isActive: true,
            isDefault: true,
          },
        ],
      });
      prisma.product.findUniqueOrThrow.mockResolvedValue(full);
      const out = await service.addVariant('p1', {
        name: 'L',
        regularPrice: 10,
      });
      expect(out.pricing.hasVariants).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws when product missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addVariant('x', { name: 'L', regularPrice: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on P2002', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.$transaction.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['productId', 'name'] },
      });
      await expect(
        service.addVariant('p1', { name: 'L', regularPrice: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws when offerPrice >= regularPrice', async () => {
      await expect(
        service.addVariant('p1', {
          name: 'L',
          regularPrice: 5,
          offerPrice: 6,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVariant', () => {
    it('throws when variant missing', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(null);
      await expect(
        service.updateVariant('p1', 'v1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates', async () => {
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.productVariant.update.mockResolvedValue({});
      const full = baseRelations({
        regularPrice: null,
        variants: [
          {
            id: 'v1',
            name: 'XL',
            sortOrder: 0,
            regularPrice: d('12'),
            offerPrice: null,
            isActive: true,
            isDefault: true,
          },
        ],
      });
      prisma.product.findUniqueOrThrow.mockResolvedValue(full);
      const out = await service.updateVariant('p1', 'v1', { name: 'XL' });
      expect(out.pricing.variants[0].name).toBe('XL');
    });

    it('throws when offerPrice >= regularPrice', async () => {
      await expect(
        service.updateVariant('p1', 'v1', {
          regularPrice: 10,
          offerPrice: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeVariant', () => {
    it('throws when last active variant and no regularPrice', async () => {
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'v1' });
      // parallel: product (select regularPrice) + variant count
      prisma.product.findUnique.mockResolvedValue({ regularPrice: null });
      prisma.productVariant.count.mockResolvedValue(0);
      await expect(service.removeVariant('p1', 'v1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes when regularPrice set', async () => {
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.product.findUnique.mockResolvedValue({ regularPrice: d('12.00') });
      prisma.productVariant.count.mockResolvedValue(0);
      prisma.productVariant.delete.mockResolvedValue({});
      const full = baseRelations();
      prisma.product.findUniqueOrThrow.mockResolvedValue(full);
      await service.removeVariant('p1', 'v1');
      expect(prisma.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
    });
  });

  describe('addAllergyItems', () => {
    it('throws when ids invalid', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.allergyItem.findMany.mockResolvedValue([{ id: 'a1' }]);
      await expect(
        service.addAllergyItems('p1', { allergyItemIds: ['a1', 'a2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does NOT throw for duplicate ids that are all valid', async () => {
      // Client sent ['a1','a1'] — both are the same valid id; should NOT throw
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.allergyItem.findMany.mockResolvedValue([{ id: 'a1' }]);
      prisma.productAllergyItem.createMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(baseRelations());
      await expect(
        service.addAllergyItems('p1', { allergyItemIds: ['a1', 'a1'] }),
      ).resolves.toBeDefined();
      // Deduplication means createMany receives only one entry
      expect(prisma.productAllergyItem.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [{ productId: 'p1', allergyItemId: 'a1' }],
        }),
      );
    });

    it('createMany and returns product', async () => {
      prisma.product.findUnique.mockResolvedValue(baseRelations());
      prisma.allergyItem.findMany.mockResolvedValue([
        { id: 'a1' },
        { id: 'a2' },
      ]);
      prisma.productAllergyItem.createMany.mockResolvedValue({ count: 2 });
      const full = baseRelations({
        allergyItems: [
          {
            allergyItem: {
              id: 'a1',
              name: 'Gluten',
              iconUrl: null,
            },
          },
        ],
      });
      prisma.product.findUniqueOrThrow.mockResolvedValue(full);
      const out = await service.addAllergyItems('p1', {
        allergyItemIds: ['a1', 'a2'],
      });
      expect(out.allergyItems).toHaveLength(1);
    });
  });

  describe('removeAllergyItem', () => {
    it('throws when link missing', async () => {
      prisma.productAllergyItem.findUnique.mockResolvedValue(null);
      await expect(service.removeAllergyItem('p1', 'a1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes link', async () => {
      prisma.productAllergyItem.findUnique.mockResolvedValue({
        productId: 'p1',
        allergyItemId: 'a1',
      });
      prisma.productAllergyItem.delete.mockResolvedValue({});
      prisma.product.findUniqueOrThrow.mockResolvedValue(baseRelations());
      await service.removeAllergyItem('p1', 'a1');
      expect(prisma.productAllergyItem.delete).toHaveBeenCalled();
    });
  });
});

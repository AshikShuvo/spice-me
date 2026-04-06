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
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const prisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
  };

  const baseCategory = {
    id: 'cat1',
    name: 'Pizza',
    description: null as string | null,
    imageUrl: null as string | null,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns categories with counts', async () => {
      const row = {
        ...baseCategory,
        _count: { subCategories: 2, products: 5 },
      };
      prisma.category.findMany.mockResolvedValue([row]);
      const out = await service.findAll();
      expect(out).toHaveLength(1);
      expect(out[0]._count.subCategories).toBe(2);
    });
  });

  describe('findOne', () => {
    it('returns category with subcategories', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        subCategories: [],
      });
      const out = await service.findOne('cat1');
      expect(out.id).toBe('cat1');
    });

    it('throws when missing', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates category', async () => {
      prisma.category.create.mockResolvedValue({
        ...baseCategory,
        name: 'Drinks',
      });
      const out = await service.create({
        name: '  Drinks  ',
        sortOrder: 1,
      });
      expect(out.name).toBe('Drinks');
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Drinks', sortOrder: 1 }),
        }),
      );
    });

    it('throws ConflictException on duplicate name (P2002)', async () => {
      prisma.category.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });
      await expect(service.create({ name: 'Dup' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('partial update', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      prisma.category.update.mockResolvedValue({
        ...baseCategory,
        name: 'New',
      });
      const out = await service.update('cat1', { name: 'New' });
      expect(out.name).toBe('New');
    });

    it('throws when category missing', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'N' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on P2002', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      prisma.category.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });
      await expect(service.update('cat1', { name: 'Taken' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes when no products', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      prisma.product.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue(baseCategory);
      const out = await service.remove('cat1');
      expect(out.message).toContain('deleted');
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat1' },
      });
    });

    it('throws when products exist', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      prisma.product.count.mockResolvedValue(1);
      await expect(service.remove('cat1')).rejects.toThrow(ConflictException);
    });

    it('throws when category missing', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSubCategory', () => {
    it('creates when category exists', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      const sub = {
        id: 's1',
        name: 'Italian',
        categoryId: 'cat1',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        imageUrl: null,
      };
      prisma.subCategory.create.mockResolvedValue(sub);
      const out = await service.createSubCategory('cat1', { name: 'Italian' });
      expect(out.name).toBe('Italian');
    });

    it('throws when category missing', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.createSubCategory('x', { name: 'S' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on P2002', async () => {
      prisma.category.findUnique.mockResolvedValue(baseCategory);
      prisma.subCategory.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name', 'categoryId'] },
      });
      await expect(
        service.createSubCategory('cat1', { name: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateSubCategory', () => {
    it('updates', async () => {
      prisma.subCategory.findFirst.mockResolvedValue({
        id: 's1',
        categoryId: 'cat1',
      });
      prisma.subCategory.update.mockResolvedValue({
        ...baseCategory,
        id: 's1',
        name: 'X',
        categoryId: 'cat1',
      });
      const out = await service.updateSubCategory('cat1', 's1', {
        name: 'X',
      });
      expect(out.name).toBe('X');
    });

    it('throws when sub missing', async () => {
      prisma.subCategory.findFirst.mockResolvedValue(null);
      await expect(
        service.updateSubCategory('cat1', 's1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSubCategory', () => {
    it('deletes when no products', async () => {
      prisma.subCategory.findFirst.mockResolvedValue({ id: 's1' });
      prisma.product.count.mockResolvedValue(0);
      const out = await service.removeSubCategory('cat1', 's1');
      expect(out.message).toContain('deleted');
      expect(prisma.subCategory.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });

    it('throws when products use subcategory', async () => {
      prisma.subCategory.findFirst.mockResolvedValue({ id: 's1' });
      prisma.product.count.mockResolvedValue(1);
      await expect(service.removeSubCategory('cat1', 's1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

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
import { AllergyItemsService } from './allergy-items.service.js';

describe('AllergyItemsService', () => {
  let service: AllergyItemsService;
  const prisma = {
    allergyItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const baseItem = {
    id: 'a1',
    name: 'Gluten',
    description: null as string | null,
    iconUrl: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllergyItemsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AllergyItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns items ordered by name', async () => {
      prisma.allergyItem.findMany.mockResolvedValue([baseItem]);
      const out = await service.findAll();
      expect(out).toHaveLength(1);
      expect(prisma.allergyItem.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns item', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(baseItem);
      const out = await service.findOne('a1');
      expect(out.id).toBe('a1');
    });

    it('throws when missing', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates', async () => {
      prisma.allergyItem.create.mockResolvedValue(baseItem);
      const out = await service.create({ name: '  Gluten  ' });
      expect(prisma.allergyItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Gluten' }),
        }),
      );
      expect(out.name).toBe('Gluten');
    });

    it('throws ConflictException on duplicate name', async () => {
      prisma.allergyItem.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });
      await expect(service.create({ name: 'Gluten' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('updates', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(baseItem);
      prisma.allergyItem.update.mockResolvedValue({
        ...baseItem,
        name: 'Milk',
      });
      const out = await service.update('a1', { name: 'Milk' });
      expect(out.name).toBe('Milk');
    });

    it('throws when missing', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'M' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on P2002', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(baseItem);
      prisma.allergyItem.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });
      await expect(service.update('a1', { name: 'Taken' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(baseItem);
      prisma.allergyItem.delete.mockResolvedValue(baseItem);
      const out = await service.remove('a1');
      expect(out.message).toContain('deleted');
    });

    it('throws when missing', async () => {
      prisma.allergyItem.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});

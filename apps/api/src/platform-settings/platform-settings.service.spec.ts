import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlatformSettingsService } from './platform-settings.service.js';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  const prisma = {
    platformCommonSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PlatformSettingsService);
  });

  it('getOrCreate returns row when present', async () => {
    prisma.platformCommonSettings.findUnique.mockResolvedValue({
      id: 'default',
      foodVatPercent: { toString: () => '12.5' },
      currencyCode: 'NOK',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const out = await service.getOrCreate();
    expect(out).toEqual({
      foodVatPercent: '12.5',
      currencyCode: 'NOK',
    });
  });

  it('getOrCreate creates default row when missing', async () => {
    prisma.platformCommonSettings.findUnique.mockResolvedValue(null);
    prisma.platformCommonSettings.create.mockResolvedValue({
      id: 'default',
      foodVatPercent: { toString: () => '0' },
      currencyCode: 'EUR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const out = await service.getOrCreate();
    expect(prisma.platformCommonSettings.create).toHaveBeenCalled();
    expect(out.currencyCode).toBe('EUR');
  });

  it('update upserts partial fields', async () => {
    prisma.platformCommonSettings.upsert.mockResolvedValue({
      id: 'default',
      foodVatPercent: { toString: () => '20' },
      currencyCode: 'GBP',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const out = await service.update({
      foodVatPercent: 20,
      currencyCode: 'GBP',
    });
    expect(out.foodVatPercent).toBe('20');
    expect(out.currencyCode).toBe('GBP');
  });

  it('update with empty dto returns getOrCreate', async () => {
    prisma.platformCommonSettings.findUnique.mockResolvedValue({
      id: 'default',
      foodVatPercent: { toString: () => '0' },
      currencyCode: 'EUR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await service.update({});
    expect(prisma.platformCommonSettings.upsert).not.toHaveBeenCalled();
  });
});

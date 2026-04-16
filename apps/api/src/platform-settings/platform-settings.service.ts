import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto.js';

export type PlatformSettingsPublic = {
  foodVatPercent: string;
  currencyCode: string;
};

@Injectable()
export class PlatformSettingsService {
  private static readonly SINGLETON_ID = 'default';

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(): Promise<PlatformSettingsPublic> {
    let row = await this.prisma.platformCommonSettings.findUnique({
      where: { id: PlatformSettingsService.SINGLETON_ID },
    });
    if (!row) {
      row = await this.prisma.platformCommonSettings.create({
        data: {
          id: PlatformSettingsService.SINGLETON_ID,
          foodVatPercent: 0,
          currencyCode: 'EUR',
        },
      });
    }
    return {
      foodVatPercent: row.foodVatPercent.toString(),
      currencyCode: row.currencyCode,
    };
  }

  async update(
    dto: UpdatePlatformSettingsDto,
  ): Promise<PlatformSettingsPublic> {
    if (dto.foodVatPercent === undefined && dto.currencyCode === undefined) {
      return this.getOrCreate();
    }
    const row = await this.prisma.platformCommonSettings.upsert({
      where: { id: PlatformSettingsService.SINGLETON_ID },
      create: {
        id: PlatformSettingsService.SINGLETON_ID,
        foodVatPercent: dto.foodVatPercent ?? 0,
        currencyCode: dto.currencyCode ?? 'EUR',
      },
      update: {
        ...(dto.foodVatPercent !== undefined && {
          foodVatPercent: dto.foodVatPercent,
        }),
        ...(dto.currencyCode !== undefined && {
          currencyCode: dto.currencyCode,
        }),
      },
    });
    return {
      foodVatPercent: row.foodVatPercent.toString(),
      currencyCode: row.currencyCode,
    };
  }
}

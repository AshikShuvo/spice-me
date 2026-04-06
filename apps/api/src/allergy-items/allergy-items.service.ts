import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaUniqueViolation,
  uniqueConstraintFieldsFromMeta,
} from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAllergyItemDto } from './dto/create-allergy-item.dto.js';
import type { UpdateAllergyItemDto } from './dto/update-allergy-item.dto.js';

@Injectable()
export class AllergyItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private handleUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('name')) {
        throw new ConflictException(
          'An allergy item with this name already exists',
        );
      }
      throw new ConflictException('Duplicate allergy item record');
    }
    throw error;
  }

  findAll() {
    return this.prisma.allergyItem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.allergyItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Allergy item not found');
    }
    return item;
  }

  async create(dto: CreateAllergyItemDto) {
    try {
      return await this.prisma.allergyItem.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          iconUrl: dto.iconUrl,
        },
      });
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async update(id: string, dto: UpdateAllergyItemDto) {
    const existing = await this.prisma.allergyItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Allergy item not found');
    }
    try {
      return await this.prisma.allergyItem.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
        },
      });
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.allergyItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Allergy item not found');
    }
    await this.prisma.allergyItem.delete({ where: { id } });
    return { message: 'Allergy item deleted' };
  }
}

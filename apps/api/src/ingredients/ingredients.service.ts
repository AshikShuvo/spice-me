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
import type { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import type { UpdateIngredientDto } from './dto/update-ingredient.dto.js';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  private handleUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('name')) {
        throw new ConflictException(
          'An ingredient with this name already exists',
        );
      }
      throw new ConflictException('Duplicate ingredient record');
    }
    throw error;
  }

  findAll() {
    return this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Ingredient not found');
    }
    return item;
  }

  async create(dto: CreateIngredientDto) {
    try {
      return await this.prisma.ingredient.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() ?? null,
          isAllergen: dto.isAllergen ?? false,
        },
      });
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async update(id: string, dto: UpdateIngredientDto) {
    const existing = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Ingredient not found');
    }
    try {
      return await this.prisma.ingredient.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description?.trim() ?? null,
          }),
          ...(dto.isAllergen !== undefined && { isAllergen: dto.isAllergen }),
        },
      });
    } catch (e) {
      this.handleUniqueViolation(e);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Ingredient not found');
    }
    try {
      await this.prisma.ingredient.delete({ where: { id } });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2003') {
        throw new ConflictException(
          'Ingredient is used by a product or template and cannot be deleted',
        );
      }
      throw e;
    }
    return { message: 'Ingredient deleted' };
  }
}

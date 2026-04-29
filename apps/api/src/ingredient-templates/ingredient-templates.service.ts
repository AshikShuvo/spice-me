import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateIngredientTemplateDto } from './dto/create-ingredient-template.dto.js';
import type { UpdateIngredientTemplateDto } from './dto/update-ingredient-template.dto.js';

const templateInclude = {
  items: {
    include: { ingredient: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

export type IngredientTemplateProfile = Awaited<
  ReturnType<IngredientTemplatesService['findOne']>
>;

@Injectable()
export class IngredientTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateIngredientIds(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)];
    const found = await this.prisma.ingredient.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException('One or more ingredient IDs are invalid');
    }
  }

  findAll() {
    return this.prisma.ingredientTemplate.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: templateInclude,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.ingredientTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!row) {
      throw new NotFoundException('Ingredient template not found');
    }
    return row;
  }

  async create(dto: CreateIngredientTemplateDto) {
    const ids = dto.items.map((i) => i.ingredientId);
    await this.validateIngredientIds(ids);

    return this.prisma.ingredientTemplate.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        sortOrder: dto.sortOrder ?? 0,
        items: {
          create: dto.items.map((item, index) => ({
            ingredientId: item.ingredientId,
            extraPrice: item.extraPrice,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: templateInclude,
    });
  }

  async update(id: string, dto: UpdateIngredientTemplateDto) {
    await this.findOne(id);

    if (dto.items) {
      const ids = dto.items.map((i) => i.ingredientId);
      await this.validateIngredientIds(ids);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.ingredientTemplateItem.deleteMany({
          where: { templateId: id },
        });
      }
      return tx.ingredientTemplate.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description?.trim() ?? null,
          }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.items && {
            items: {
              create: dto.items.map((item, index) => ({
                ingredientId: item.ingredientId,
                extraPrice: item.extraPrice,
                sortOrder: item.sortOrder ?? index,
              })),
            },
          }),
        },
        include: templateInclude,
      });
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.ingredientTemplate.delete({ where: { id } });
    return { message: 'Ingredient template deleted' };
  }
}

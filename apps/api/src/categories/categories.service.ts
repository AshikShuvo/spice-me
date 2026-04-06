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
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { CreateSubCategoryDto } from './dto/create-subcategory.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';
import type { UpdateSubCategoryDto } from './dto/update-subcategory.dto.js';

export type CategoryListItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { subCategories: number; products: number };
};

export type CategoryWithSubCategories = Awaited<
  ReturnType<CategoriesService['findOne']>
>;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private handleCategoryUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('name')) {
        throw new ConflictException('A category with this name already exists');
      }
      throw new ConflictException('Duplicate category record');
    }
    throw error;
  }

  private handleSubCategoryUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('name') || fields.includes('categoryId')) {
        throw new ConflictException(
          'A subcategory with this name already exists in this category',
        );
      }
      throw new ConflictException('Duplicate subcategory record');
    }
    throw error;
  }

  async findAll(): Promise<CategoryListItem[]> {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { subCategories: true, products: true } },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          imageUrl: dto.imageUrl,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (e) {
      this.handleCategoryUniqueViolation(e);
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (e) {
      this.handleCategoryUniqueViolation(e);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new ConflictException(
        'Category has products and cannot be deleted',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  async createSubCategory(categoryId: string, dto: CreateSubCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    try {
      return await this.prisma.subCategory.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          imageUrl: dto.imageUrl,
          sortOrder: dto.sortOrder ?? 0,
          categoryId,
        },
      });
    } catch (e) {
      this.handleSubCategoryUniqueViolation(e);
    }
  }

  async updateSubCategory(
    categoryId: string,
    subId: string,
    dto: UpdateSubCategoryDto,
  ) {
    const sub = await this.prisma.subCategory.findFirst({
      where: { id: subId, categoryId },
    });
    if (!sub) {
      throw new NotFoundException('Subcategory not found');
    }
    try {
      return await this.prisma.subCategory.update({
        where: { id: subId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (e) {
      this.handleSubCategoryUniqueViolation(e);
    }
  }

  async removeSubCategory(
    categoryId: string,
    subId: string,
  ): Promise<{ message: string }> {
    const sub = await this.prisma.subCategory.findFirst({
      where: { id: subId, categoryId },
    });
    if (!sub) {
      throw new NotFoundException('Subcategory not found');
    }
    const productCount = await this.prisma.product.count({
      where: { subCategoryId: subId },
    });
    if (productCount > 0) {
      throw new ConflictException(
        'Subcategory has products and cannot be deleted',
      );
    }
    await this.prisma.subCategory.delete({ where: { id: subId } });
    return { message: 'Subcategory deleted' };
  }
}

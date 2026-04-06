import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaUniqueViolation,
  uniqueConstraintFieldsFromMeta,
} from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AddAllergyItemsDto } from './dto/add-allergy-items.dto.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { CreateVariantDto } from './dto/create-variant.dto.js';
import type { ListProductsQueryDto } from './dto/list-products-query.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { UpdateProductPublishDto } from './dto/update-product-publish.dto.js';
import type { UpdateVariantDto } from './dto/update-variant.dto.js';

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  subCategory: { select: { id: true, name: true } },
  variants: { orderBy: { sortOrder: 'asc' as const } },
  allergyItems: { include: { allergyItem: true } },
} as const;

export type ProductVariantProfile = {
  id: string;
  name: string;
  sortOrder: number;
  basePrice: string;
  salePrice: string | null;
  isActive: boolean;
};

export type ProductProfile = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  subCategoryId: string | null;
  isPublished: boolean;
  isActive: boolean;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  pricing: {
    hasVariants: boolean;
    basePrice: string | null;
    salePrice: string | null;
    variants: ProductVariantProfile[];
  };
  allergyItems: Array<{ id: string; name: string; iconUrl: string | null }>;
  createdAt: Date;
  updatedAt: Date;
};

function decToString(
  v: { toString(): string } | null | undefined,
): string | null {
  if (v === null || v === undefined) return null;
  return v.toString();
}

export type ProductWithRelations = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  subCategoryId: string | null;
  isPublished: boolean;
  isActive: boolean;
  basePrice: { toString(): string } | null;
  salePrice: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  variants: Array<{
    id: string;
    name: string;
    sortOrder: number;
    basePrice: { toString(): string };
    salePrice: { toString(): string } | null;
    isActive: boolean;
  }>;
  allergyItems: Array<{
    allergyItem: {
      id: string;
      name: string;
      iconUrl: string | null;
    };
  }>;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Throws BadRequestException when salePrice is set but >= basePrice. */
  private assertPricing(
    basePrice: number | undefined | null,
    salePrice: number | undefined | null,
  ): void {
    if (
      salePrice !== undefined &&
      salePrice !== null &&
      basePrice !== undefined &&
      basePrice !== null &&
      salePrice >= basePrice
    ) {
      throw new BadRequestException(
        'Sale price must be less than the base price',
      );
    }
  }

  private handleVariantUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('name') || fields.includes('productId')) {
        throw new ConflictException(
          'A variant with this name already exists for this product',
        );
      }
      throw new ConflictException('Duplicate variant record');
    }
    throw error;
  }

  toProfile(p: ProductWithRelations): ProductProfile {
    const activeVariants = p.variants.filter((v) => v.isActive);
    const hasVariants = activeVariants.length > 0;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      subCategoryId: p.subCategoryId,
      isPublished: p.isPublished,
      isActive: p.isActive,
      category: p.category,
      subCategory: p.subCategory,
      pricing: {
        hasVariants,
        basePrice: hasVariants ? null : decToString(p.basePrice),
        salePrice: hasVariants ? null : decToString(p.salePrice),
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sortOrder: v.sortOrder,
          basePrice: v.basePrice.toString(),
          salePrice: decToString(v.salePrice),
          isActive: v.isActive,
        })),
      },
      allergyItems: p.allergyItems.map((pai) => ({
        id: pai.allergyItem.id,
        name: pai.allergyItem.name,
        iconUrl: pai.allergyItem.iconUrl,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private async assertSubCategoryBelongsToCategory(
    subCategoryId: string,
    categoryId: string,
  ): Promise<void> {
    const sub = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!sub) {
      throw new BadRequestException('Subcategory not found');
    }
    if (sub.categoryId !== categoryId) {
      throw new BadRequestException(
        'Subcategory does not belong to the selected category',
      );
    }
  }

  async create(dto: CreateProductDto): Promise<ProductProfile> {
    this.assertPricing(dto.basePrice, dto.salePrice);
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.subCategoryId) {
      await this.assertSubCategoryBelongsToCategory(
        dto.subCategoryId,
        dto.categoryId,
      );
    }
    const created = await this.prisma.product.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        imageUrl: dto.imageUrl.trim(),
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        basePrice: dto.basePrice,
        salePrice: dto.salePrice,
      },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(created as ProductWithRelations);
  }

  async findAll(
    query: ListProductsQueryDto,
    adminView: boolean,
  ): Promise<{
    data: ProductProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: {
      isPublished?: boolean;
      isActive?: boolean;
      categoryId?: string;
      subCategoryId?: string;
    } = {};
    if (!adminView) {
      where.isPublished = true;
      where.isActive = true;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.subCategoryId) {
      where.subCategoryId = query.subCategoryId;
    }
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.toProfile(r as ProductWithRelations)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, adminView: boolean): Promise<ProductProfile> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!adminView && (!product.isPublished || !product.isActive)) {
      throw new NotFoundException('Product not found');
    }
    return this.toProfile(product as ProductWithRelations);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductProfile> {
    this.assertPricing(dto.basePrice, dto.salePrice);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const categoryId = dto.categoryId ?? existing.categoryId;
    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) {
        throw new NotFoundException('Category not found');
      }
    }
    const subId =
      dto.subCategoryId !== undefined
        ? dto.subCategoryId
        : existing.subCategoryId;
    if (subId) {
      await this.assertSubCategoryBelongsToCategory(subId, categoryId);
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl.trim() }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.subCategoryId !== undefined && {
          subCategoryId: dto.subCategoryId,
        }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
      },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(updated as ProductWithRelations);
  }

  async publish(
    id: string,
    dto: UpdateProductPublishDto,
  ): Promise<ProductProfile> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: { where: { isActive: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    if (!existing.isActive) {
      throw new BadRequestException('Cannot publish an inactive product');
    }
    if (dto.isPublished) {
      const hasPrice = existing.basePrice !== null;
      const hasVariant = existing.variants.length > 0;
      if (!hasPrice && !hasVariant) {
        throw new BadRequestException(
          'Product must have a base price or at least one active variant before publishing',
        );
      }
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isPublished: dto.isPublished },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(updated as ProductWithRelations);
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false, isPublished: false },
    });
    return { message: 'Product deleted' };
  }

  async addVariant(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductProfile> {
    this.assertPricing(dto.basePrice, dto.salePrice);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    try {
      await this.prisma.$transaction([
        this.prisma.productVariant.create({
          data: {
            productId,
            name: dto.name.trim(),
            sortOrder: dto.sortOrder ?? 0,
            basePrice: dto.basePrice,
            salePrice: dto.salePrice,
          },
        }),
        this.prisma.product.update({
          where: { id: productId },
          data: { basePrice: null, salePrice: null },
        }),
      ]);
    } catch (e) {
      this.handleVariantUniqueViolation(e);
    }
    const full = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(full as ProductWithRelations);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductProfile> {
    this.assertPricing(dto.basePrice, dto.salePrice);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    try {
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
          ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (e) {
      this.handleVariantUniqueViolation(e);
    }
    const full = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(full as ProductWithRelations);
  }

  async removeVariant(
    productId: string,
    variantId: string,
  ): Promise<ProductProfile> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    // Run both checks in parallel — saves one sequential round-trip.
    const [product, otherActive] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: productId },
        select: { basePrice: true },
      }),
      this.prisma.productVariant.count({
        where: { productId, isActive: true, id: { not: variantId } },
      }),
    ]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (otherActive === 0 && product.basePrice === null) {
      throw new BadRequestException(
        'Cannot remove the last variant from a product without a base price. Set a base price first.',
      );
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    const full = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(full as ProductWithRelations);
  }

  async addAllergyItems(
    productId: string,
    dto: AddAllergyItemsDto,
  ): Promise<ProductProfile> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // Deduplicate before validating to avoid false-positive "invalid IDs" errors
    // when the client accidentally sends duplicate values in the array.
    const uniqueIds = [...new Set(dto.allergyItemIds)];
    const items = await this.prisma.allergyItem.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (items.length !== uniqueIds.length) {
      throw new BadRequestException('One or more allergy item IDs are invalid');
    }
    await this.prisma.productAllergyItem.createMany({
      data: uniqueIds.map((allergyItemId) => ({
        productId,
        allergyItemId,
      })),
      skipDuplicates: true,
    });
    const full = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(full as ProductWithRelations);
  }

  async removeAllergyItem(
    productId: string,
    allergyItemId: string,
  ): Promise<ProductProfile> {
    const link = await this.prisma.productAllergyItem.findUnique({
      where: {
        productId_allergyItemId: { productId, allergyItemId },
      },
    });
    if (!link) {
      throw new NotFoundException('Allergy link not found');
    }
    await this.prisma.productAllergyItem.delete({
      where: {
        productId_allergyItemId: { productId, allergyItemId },
      },
    });
    const full = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    return this.toProfile(full as ProductWithRelations);
  }
}

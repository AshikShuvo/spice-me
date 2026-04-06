import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaUniqueViolation,
  uniqueConstraintFieldsFromMeta,
} from '../common/prisma-error.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ProductsService,
  type ProductProfile,
  type ProductWithRelations,
} from '../products/products.service.js';
import type { AddRestaurantProductDto } from './dto/add-restaurant-product.dto.js';
import type { UpdateRestaurantProductDto } from './dto/update-restaurant-product.dto.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';

const PRODUCT_INCLUDE_LITE = {
  category: { select: { id: true, name: true } },
  subCategory: { select: { id: true, name: true } },
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  allergyItems: { include: { allergyItem: true } },
} as const;

@Injectable()
export class RestaurantProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  private async assertRestaurantAccess(
    restaurantId: string,
    userId: string,
  ): Promise<void> {
    const assignment = await this.prisma.restaurantAdminAssignment.findFirst({
      where: { restaurantId, userId },
    });
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this restaurant');
    }
  }

  private handleRestaurantProductUniqueViolation(error: unknown): never {
    if (isPrismaUniqueViolation(error)) {
      const fields = uniqueConstraintFieldsFromMeta(
        (error as { meta?: unknown }).meta,
      );
      if (fields.includes('restaurantId') || fields.includes('productId')) {
        throw new ConflictException(
          'Product is already added to this restaurant',
        );
      }
      throw new ConflictException('Duplicate restaurant product record');
    }
    throw error;
  }

  async findAllManaged(
    restaurantId: string,
    currentUser: JwtUser,
  ): Promise<
    Array<{
      id: string;
      restaurantId: string;
      productId: string;
      isAvailable: boolean;
      addedAt: string;
      updatedAt: string;
      product: ProductProfile;
    }>
  > {
    await this.assertRestaurantAccess(restaurantId, currentUser.userId);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const rows = await this.prisma.restaurantProduct.findMany({
      where: { restaurantId },
      include: { product: { include: PRODUCT_INCLUDE_LITE } },
      orderBy: { addedAt: 'desc' },
    });
    return rows.map((r) => this.toManageRow(r));
  }

  private toManageRow(r: {
    id: string;
    restaurantId: string;
    productId: string;
    isAvailable: boolean;
    addedAt: Date;
    updatedAt: Date;
    product: ProductWithRelations;
  }) {
    return {
      id: r.id,
      restaurantId: r.restaurantId,
      productId: r.productId,
      isAvailable: r.isAvailable,
      addedAt: r.addedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      product: this.productsService.toProfile(r.product),
    };
  }

  async findAvailable(restaurantId: string): Promise<ProductProfile[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const rows = await this.prisma.restaurantProduct.findMany({
      where: {
        restaurantId,
        isAvailable: true,
        product: { isPublished: true, isActive: true },
      },
      include: {
        product: { include: PRODUCT_INCLUDE_LITE },
      },
      orderBy: { addedAt: 'desc' },
    });
    return rows.map((r) =>
      this.productsService.toProfile(r.product as ProductWithRelations),
    );
  }

  async addProduct(
    restaurantId: string,
    dto: AddRestaurantProductDto,
    currentUser: JwtUser,
  ) {
    await this.assertRestaurantAccess(restaurantId, currentUser.userId);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.isPublished) {
      throw new BadRequestException('Product is not published');
    }
    try {
      const created = await this.prisma.restaurantProduct.create({
        data: {
          restaurantId,
          productId: dto.productId,
        },
        include: { product: { include: PRODUCT_INCLUDE_LITE } },
      });
      return this.toManageRow({
        ...created,
        product: created.product as ProductWithRelations,
      });
    } catch (e) {
      this.handleRestaurantProductUniqueViolation(e);
    }
  }

  async updateAvailability(
    restaurantId: string,
    productId: string,
    dto: UpdateRestaurantProductDto,
    currentUser: JwtUser,
  ) {
    await this.assertRestaurantAccess(restaurantId, currentUser.userId);
    const link = await this.prisma.restaurantProduct.findFirst({
      where: { restaurantId, productId },
    });
    if (!link) {
      throw new NotFoundException('Product is not linked to this restaurant');
    }
    const updated = await this.prisma.restaurantProduct.update({
      where: { id: link.id },
      data: { isAvailable: dto.isAvailable },
      include: { product: { include: PRODUCT_INCLUDE_LITE } },
    });
    return this.toManageRow({
      ...updated,
      product: updated.product as ProductWithRelations,
    });
  }

  async removeProduct(
    restaurantId: string,
    productId: string,
    currentUser: JwtUser,
  ): Promise<{ message: string }> {
    await this.assertRestaurantAccess(restaurantId, currentUser.userId);
    const link = await this.prisma.restaurantProduct.findFirst({
      where: { restaurantId, productId },
    });
    if (!link) {
      throw new NotFoundException('Product is not linked to this restaurant');
    }
    await this.prisma.restaurantProduct.delete({ where: { id: link.id } });
    return { message: 'Product removed from restaurant' };
  }
}

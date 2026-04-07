import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PRODUCT_INCLUDE } from '../products/product-include.js';
import {
  ProductsService,
  type ProductProfile,
  type ProductWithRelations,
} from '../products/products.service.js';

export type MenuSubCategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuCategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
  subCategories: MenuSubCategoryItem[];
};

export type MenuResponse = {
  scope: 'global' | 'restaurant';
  restaurant: { id: string; name: string; code: string } | null;
  categories: MenuCategoryItem[];
  products: ProductProfile[];
};

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async getMenu(restaurantCode?: string): Promise<MenuResponse> {
    const code = restaurantCode?.trim();
    if (code) {
      return this.getRestaurantMenu(code);
    }
    return this.getGlobalMenu();
  }

  private async getGlobalMenu(): Promise<MenuResponse> {
    const rows = await this.prisma.product.findMany({
      where: { isPublished: true, isActive: true },
      orderBy: { title: 'asc' },
      include: PRODUCT_INCLUDE,
    });
    return this.buildMenuResponse(
      'global',
      null,
      rows as unknown as ProductWithRelations[],
    );
  }

  private async getRestaurantMenu(code: string): Promise<MenuResponse> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { code },
    });
    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurant not found');
    }
    const links = await this.prisma.restaurantProduct.findMany({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
        product: { isPublished: true, isActive: true },
      },
      include: {
        product: { include: PRODUCT_INCLUDE },
      },
      orderBy: { product: { title: 'asc' } },
    });
    const rows = links.map((l) => l.product as unknown as ProductWithRelations);
    return this.buildMenuResponse(
      'restaurant',
      {
        id: restaurant.id,
        name: restaurant.name,
        code: restaurant.code,
      },
      rows,
    );
  }

  private async buildMenuResponse(
    scope: 'global' | 'restaurant',
    restaurant: MenuResponse['restaurant'],
    productRows: ProductWithRelations[],
  ): Promise<MenuResponse> {
    const profiles = productRows.map((r) => this.productsService.toProfile(r));
    const categoryIdSet = new Set(profiles.map((p) => p.categoryId));
    const categoryIds = [...categoryIdSet];

    if (categoryIds.length === 0) {
      return { scope, restaurant, categories: [], products: [] };
    }

    const categoryRows = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, sortOrder: true },
        },
      },
    });

    const activeCategoryIds = new Set(categoryRows.map((c) => c.id));
    const filteredProfiles = profiles.filter((p) =>
      activeCategoryIds.has(p.categoryId),
    );

    const categories: MenuCategoryItem[] = categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
      subCategories: c.subCategories.map((s) => ({
        id: s.id,
        name: s.name,
        sortOrder: s.sortOrder,
      })),
    }));

    return {
      scope,
      restaurant,
      categories,
      products: filteredProfiles,
    };
  }
}

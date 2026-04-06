import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { AddAllergyItemsDto } from './dto/add-allergy-items.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateProductPublishDto } from './dto/update-product-publish.dto.js';
import { UpdateVariantDto } from './dto/update-variant.dto.js';
import { ProductsService, type ProductProfile } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all products including unpublished (admin)' })
  findAllAdmin(@Query() query: ListProductsQueryDto): Promise<{
    data: ProductProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.productsService.findAll(query, true);
  }

  @Get()
  @ApiOperation({ summary: 'List published products (public)' })
  findAllPublic(@Query() query: ListProductsQueryDto): Promise<{
    data: ProductProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.productsService.findAll(query, false);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create product' })
  create(@Body() dto: CreateProductDto): Promise<ProductProfile> {
    return this.productsService.create(dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Get product by id (admin sees unpublished; public only published)',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser | undefined,
  ): Promise<ProductProfile> {
    const adminView = user?.role === Role.ADMIN;
    return this.productsService.findOne(id, adminView);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set product published state' })
  publish(
    @Param('id') id: string,
    @Body() dto: UpdateProductPublishDto,
  ): Promise<ProductProfile> {
    return this.productsService.publish(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductProfile> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete product' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.productsService.softDelete(id);
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add product variant' })
  addVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductProfile> {
    return this.productsService.addVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product variant' })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductProfile> {
    return this.productsService.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove product variant' })
  removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<ProductProfile> {
    return this.productsService.removeVariant(id, variantId);
  }

  @Post(':id/allergy-items')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Link allergy items to product' })
  addAllergyItems(
    @Param('id') id: string,
    @Body() dto: AddAllergyItemsDto,
  ): Promise<ProductProfile> {
    return this.productsService.addAllergyItems(id, dto);
  }

  @Delete(':id/allergy-items/:allergyItemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove allergy item link from product' })
  removeAllergyItem(
    @Param('id') id: string,
    @Param('allergyItemId') allergyItemId: string,
  ): Promise<ProductProfile> {
    return this.productsService.removeAllergyItem(id, allergyItemId);
  }
}

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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { AddRestaurantProductDto } from './dto/add-restaurant-product.dto.js';
import { UpdateRestaurantProductDto } from './dto/update-restaurant-product.dto.js';
import { RestaurantProductsService } from './restaurant-products.service.js';
import type { ProductProfile } from '../products/products.service.js';

@ApiTags('restaurant-products')
@Controller('restaurants/:restaurantId/products')
export class RestaurantProductsController {
  constructor(
    private readonly restaurantProductsService: RestaurantProductsService,
  ) {}

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'All linked products for restaurant admin (incl. unavailable)',
  })
  findAllManaged(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.restaurantProductsService.findAllManaged(restaurantId, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List available products for restaurant (public)',
  })
  findAvailable(
    @Param('restaurantId') restaurantId: string,
  ): Promise<ProductProfile[]> {
    return this.restaurantProductsService.findAvailable(restaurantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add published product to restaurant' })
  addProduct(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: AddRestaurantProductDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.restaurantProductsService.addProduct(restaurantId, dto, user);
  }

  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product availability in restaurant' })
  updateAvailability(
    @Param('restaurantId') restaurantId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateRestaurantProductDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.restaurantProductsService.updateAvailability(
      restaurantId,
      productId,
      dto,
      user,
    );
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove product from restaurant' })
  removeProduct(
    @Param('restaurantId') restaurantId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.restaurantProductsService.removeProduct(
      restaurantId,
      productId,
      user,
    );
  }
}

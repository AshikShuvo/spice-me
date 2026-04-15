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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { CreateRestaurantTableDto } from './dto/create-restaurant-table.dto.js';
import { UpdateRestaurantTableDto } from './dto/update-restaurant-table.dto.js';
import { OccupiedSlotsQueryDto } from './dto/occupied-slots-query.dto.js';
import {
  RestaurantTablesService,
  type RestaurantTableProfile,
} from './restaurant-tables.service.js';
import { TableReservationsService } from './table-reservations.service.js';

@ApiTags('restaurant-tables')
@Controller('restaurants/:restaurantId/tables')
export class RestaurantTablesController {
  constructor(
    private readonly restaurantTablesService: RestaurantTablesService,
    private readonly tableReservationsService: TableReservationsService,
  ) {}

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List all tables for restaurant (restaurant admin)',
  })
  findAllManaged(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<RestaurantTableProfile[]> {
    return this.restaurantTablesService.findAllManaged(restaurantId, user);
  }

  @Get()
  @ApiOperation({ summary: 'List active bookable tables (public)' })
  @ApiResponse({ status: 404, description: 'Restaurant not found or inactive' })
  findPublicActive(
    @Param('restaurantId') restaurantId: string,
  ): Promise<RestaurantTableProfile[]> {
    return this.restaurantTablesService.findPublicActive(restaurantId);
  }

  @Get(':tableId/occupied-slots')
  @ApiOperation({
    summary:
      'List occupied intervals on a table (pending + confirmed) for booking UI',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or table not found' })
  getOccupiedSlots(
    @Param('restaurantId') restaurantId: string,
    @Param('tableId') tableId: string,
    @Query() query: OccupiedSlotsQueryDto,
  ): Promise<{ slots: Array<{ startsAt: string; endsAt: string }> }> {
    return this.tableReservationsService.listOccupiedSlotsPublic(
      restaurantId,
      tableId,
      query.from,
      query.to,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register a physical table' })
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateRestaurantTableDto,
    @CurrentUser() user: JwtUser,
  ): Promise<RestaurantTableProfile> {
    return this.restaurantTablesService.create(restaurantId, dto, user);
  }

  @Patch(':tableId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update table' })
  update(
    @Param('restaurantId') restaurantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateRestaurantTableDto,
    @CurrentUser() user: JwtUser,
  ): Promise<RestaurantTableProfile> {
    return this.restaurantTablesService.update(
      restaurantId,
      tableId,
      dto,
      user,
    );
  }

  @Delete(':tableId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete table (only if no reservations exist)' })
  remove(
    @Param('restaurantId') restaurantId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<{ message: string }> {
    return this.restaurantTablesService.remove(restaurantId, tableId, user);
  }
}

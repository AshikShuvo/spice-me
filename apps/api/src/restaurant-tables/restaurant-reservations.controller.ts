import {
  Body,
  Controller,
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
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { CreateTableReservationDto } from './dto/create-table-reservation.dto.js';
import { ListTableReservationsQueryDto } from './dto/list-table-reservations-query.dto.js';
import {
  TableReservationsService,
  type TableReservationProfile,
} from './table-reservations.service.js';

@ApiTags('table-reservations')
@Controller('restaurants/:restaurantId/reservations')
export class RestaurantReservationsController {
  constructor(
    private readonly tableReservationsService: TableReservationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List reservations for restaurant (restaurant admin)',
  })
  listForRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListTableReservationsQueryDto,
    @CurrentUser() user: JwtUser,
  ): Promise<TableReservationProfile[]> {
    return this.tableReservationsService.listForRestaurant(
      restaurantId,
      query,
      user,
    );
  }

  @Patch(':reservationId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm a pending table reservation' })
  confirm(
    @Param('restaurantId') restaurantId: string,
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<TableReservationProfile> {
    return this.tableReservationsService.confirmByRestaurantAdmin(
      restaurantId,
      reservationId,
      user,
    );
  }

  @Patch(':reservationId/unconfirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Move a confirmed reservation back to pending (before start)',
  })
  unconfirm(
    @Param('restaurantId') restaurantId: string,
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<TableReservationProfile> {
    return this.tableReservationsService.unconfirmByRestaurantAdmin(
      restaurantId,
      reservationId,
      user,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Book a table (customer)' })
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateTableReservationDto,
    @CurrentUser() user: JwtUser,
  ): Promise<TableReservationProfile> {
    return this.tableReservationsService.create(restaurantId, dto, user);
  }
}

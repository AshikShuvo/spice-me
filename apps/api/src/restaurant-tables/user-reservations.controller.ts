import {
  Controller,
  Get,
  Param,
  Patch,
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
import { ListMyReservationsQueryDto } from './dto/list-my-reservations-query.dto.js';
import {
  TableReservationsService,
  type TableReservationProfile,
} from './table-reservations.service.js';

@ApiTags('table-reservations')
@Controller('reservations')
export class UserReservationsController {
  constructor(
    private readonly tableReservationsService: TableReservationsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my table reservations' })
  listMine(
    @Query() query: ListMyReservationsQueryDto,
    @CurrentUser() user: JwtUser,
  ): Promise<{
    data: TableReservationProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.tableReservationsService.listMine(user, query);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel my reservation' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<TableReservationProfile> {
    return this.tableReservationsService.cancel(id, user);
  }
}

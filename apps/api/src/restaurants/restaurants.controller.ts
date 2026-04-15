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
import type { UserProfile } from '../users/users.service.js';
import { AssignAdminDto } from './dto/assign-admin.dto.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { ListRestaurantsQueryDto } from './dto/list-restaurants-query.dto.js';
import { UpdateRestaurantStatusDto } from './dto/update-restaurant-status.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import {
  RestaurantsService,
  type RestaurantProfile,
} from './restaurants.service.js';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('default')
  @ApiOperation({ summary: 'Get active default restaurant (public)' })
  @ApiResponse({ status: 404, description: 'No default configured' })
  async getDefault(): Promise<RestaurantProfile> {
    return this.restaurantsService.findDefault();
  }

  @Get('browse')
  @ApiOperation({
    summary: 'List active restaurants for public browsing (id, name, code)',
  })
  browse(): Promise<Array<{ id: string; name: string; code: string }>> {
    return this.restaurantsService.findActiveForBrowse();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List restaurants assigned to current user' })
  async my(@CurrentUser() user: JwtUser): Promise<RestaurantProfile[]> {
    return this.restaurantsService.findMyRestaurants(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create restaurant' })
  async create(@Body() dto: CreateRestaurantDto): Promise<RestaurantProfile> {
    return this.restaurantsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all restaurants (admin)' })
  async list(@Query() query: ListRestaurantsQueryDto): Promise<{
    data: RestaurantProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.restaurantsService.findAll(query);
  }

  @Get(':id/admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List admins for restaurant' })
  async listAdmins(
    @Param('id') id: string,
  ): Promise<Array<{ id: string; assignedAt: Date; user: UserProfile }>> {
    return this.restaurantsService.listAdmins(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get restaurant by id' })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<RestaurantProfile> {
    return this.restaurantsService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set restaurant active/inactive' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantStatusDto,
  ): Promise<RestaurantProfile> {
    return this.restaurantsService.updateStatus(id, dto.isActive);
  }

  @Patch(':id/default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set as default restaurant' })
  async setDefault(@Param('id') id: string): Promise<RestaurantProfile> {
    return this.restaurantsService.setDefault(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update restaurant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<RestaurantProfile> {
    return this.restaurantsService.update(id, dto);
  }

  @Post(':id/admins')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign restaurant admin to restaurant' })
  async assignAdmin(
    @Param('id') id: string,
    @Body() dto: AssignAdminDto,
  ): Promise<{ id: string; restaurantId: string; userId: string }> {
    return this.restaurantsService.assignAdmin(id, dto);
  }

  @Delete(':id/admins/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove restaurant admin assignment' })
  async removeAdmin(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.restaurantsService.removeAdmin(id, userId);
  }
}

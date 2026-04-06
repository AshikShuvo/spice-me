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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AllergyItemsService } from './allergy-items.service.js';
import { CreateAllergyItemDto } from './dto/create-allergy-item.dto.js';
import { UpdateAllergyItemDto } from './dto/update-allergy-item.dto.js';

@ApiTags('allergy-items')
@Controller('allergy-items')
export class AllergyItemsController {
  constructor(private readonly allergyItemsService: AllergyItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all allergy items (public)' })
  findAll() {
    return this.allergyItemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get allergy item by id' })
  findOne(@Param('id') id: string) {
    return this.allergyItemsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create allergy item' })
  create(@Body() dto: CreateAllergyItemDto) {
    return this.allergyItemsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update allergy item' })
  update(@Param('id') id: string, @Body() dto: UpdateAllergyItemDto) {
    return this.allergyItemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete allergy item' })
  remove(@Param('id') id: string) {
    return this.allergyItemsService.remove(id);
  }
}

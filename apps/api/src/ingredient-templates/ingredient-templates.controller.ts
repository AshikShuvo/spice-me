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
import { CreateIngredientTemplateDto } from './dto/create-ingredient-template.dto.js';
import { UpdateIngredientTemplateDto } from './dto/update-ingredient-template.dto.js';
import { IngredientTemplatesService } from './ingredient-templates.service.js';

@ApiTags('ingredient-templates')
@Controller('ingredient-templates')
export class IngredientTemplatesController {
  constructor(
    private readonly ingredientTemplatesService: IngredientTemplatesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List ingredient templates (public)' })
  findAll() {
    return this.ingredientTemplatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient template by id' })
  findOne(@Param('id') id: string) {
    return this.ingredientTemplatesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create ingredient template' })
  create(@Body() dto: CreateIngredientTemplateDto) {
    return this.ingredientTemplatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update ingredient template' })
  update(@Param('id') id: string, @Body() dto: UpdateIngredientTemplateDto) {
    return this.ingredientTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete ingredient template' })
  remove(@Param('id') id: string) {
    return this.ingredientTemplatesService.remove(id);
  }
}

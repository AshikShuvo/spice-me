import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto.js';
import { PlatformSettingsService } from './platform-settings.service.js';

@ApiTags('platform')
@Controller('platform')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Global VAT % and currency (public; used for menu formatting)',
  })
  getSettings() {
    return this.platformSettingsService.getOrCreate();
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update platform VAT and currency (admin)' })
  updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.platformSettingsService.update(dto);
  }
}

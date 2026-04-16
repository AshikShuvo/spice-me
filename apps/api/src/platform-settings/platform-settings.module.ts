import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PlatformSettingsController } from './platform-settings.controller.js';
import { PlatformSettingsService } from './platform-settings.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService, RolesGuard],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}

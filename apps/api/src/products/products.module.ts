import { Module } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [PlatformSettingsModule],
  controllers: [ProductsController],
  providers: [ProductsService, RolesGuard, OptionalJwtAuthGuard],
  exports: [ProductsService],
})
export class ProductsModule {}

import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module.js';
import { ProductsModule } from '../products/products.module.js';
import { RestaurantProductsController } from './restaurant-products.controller.js';
import { RestaurantProductsService } from './restaurant-products.service.js';

@Module({
  imports: [ProductsModule, PlatformSettingsModule],
  controllers: [RestaurantProductsController],
  providers: [RestaurantProductsService, RolesGuard],
})
export class RestaurantProductsModule {}

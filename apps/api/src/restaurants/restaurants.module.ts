import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RolesGuard],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}

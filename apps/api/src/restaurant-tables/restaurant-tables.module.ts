import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RestaurantReservationsController } from './restaurant-reservations.controller.js';
import { RestaurantScopeService } from './restaurant-scope.service.js';
import { RestaurantTablesController } from './restaurant-tables.controller.js';
import { RestaurantTablesService } from './restaurant-tables.service.js';
import { TableReservationsService } from './table-reservations.service.js';
import { UserReservationsController } from './user-reservations.controller.js';

@Module({
  controllers: [
    RestaurantTablesController,
    RestaurantReservationsController,
    UserReservationsController,
  ],
  providers: [
    RestaurantTablesService,
    TableReservationsService,
    RestaurantScopeService,
    RolesGuard,
  ],
  exports: [RestaurantTablesService, TableReservationsService],
})
export class RestaurantTablesModule {}

import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AllergyItemsController } from './allergy-items.controller.js';
import { AllergyItemsService } from './allergy-items.service.js';

@Module({
  controllers: [AllergyItemsController],
  providers: [AllergyItemsService, RolesGuard],
  exports: [AllergyItemsService],
})
export class AllergyItemsModule {}

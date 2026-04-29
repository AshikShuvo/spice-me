import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { IngredientsController } from './ingredients.controller.js';
import { IngredientsService } from './ingredients.service.js';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService, RolesGuard],
  exports: [IngredientsService],
})
export class IngredientsModule {}

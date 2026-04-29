import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { IngredientTemplatesController } from './ingredient-templates.controller.js';
import { IngredientTemplatesService } from './ingredient-templates.service.js';

@Module({
  controllers: [IngredientTemplatesController],
  providers: [IngredientTemplatesService, RolesGuard],
  exports: [IngredientTemplatesService],
})
export class IngredientTemplatesModule {}

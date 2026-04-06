import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSubCategoryDto } from './create-subcategory.dto.js';

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

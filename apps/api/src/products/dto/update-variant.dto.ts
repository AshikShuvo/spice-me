import { PartialType } from '@nestjs/swagger';
import { CreateVariantDto } from './create-variant.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

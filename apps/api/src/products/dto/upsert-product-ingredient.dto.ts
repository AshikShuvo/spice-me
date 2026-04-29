import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertProductIngredientDto {
  @ApiProperty({ description: 'Ingredient id (Prisma cuid)' })
  @IsString()
  @MinLength(1)
  ingredientId!: string;

  @ApiProperty({
    type: Number,
    description: 'Extra price (net, same as product prices)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canExclude?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canAdd?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

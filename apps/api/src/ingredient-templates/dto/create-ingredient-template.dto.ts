import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class IngredientTemplateItemInputDto {
  @ApiProperty({ description: 'Ingredient id (Prisma cuid)' })
  @IsString()
  @MinLength(1)
  ingredientId!: string;

  @ApiProperty({ type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraPrice!: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateIngredientTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [IngredientTemplateItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IngredientTemplateItemInputDto)
  items!: IngredientTemplateItemInputDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ description: 'URL of product image' })
  @IsString()
  @MinLength(1)
  imageUrl!: string;

  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional({ type: Number, example: 15.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  regularPrice?: number;

  @ApiPropertyOptional({ type: Number, example: 12.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offerPrice?: number;

  @ApiPropertyOptional({
    description:
      'When true, menu prices show entered amounts only (no global food VAT).',
  })
  @IsOptional()
  @IsBoolean()
  isVatExclusive?: boolean;

  @ApiPropertyOptional({
    description:
      'Max optional extras per line item; omit or null for no limit (min 1 when set).',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsInt()
  @Min(1)
  maxOptionalIngredients?: number | null;
}

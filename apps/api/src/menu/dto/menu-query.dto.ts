import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class MenuQueryDto {
  @ApiPropertyOptional({
    description:
      'Restaurant code (e.g. RQ0001). When set, only products linked and available for that restaurant.',
    example: 'RQ0001',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  restaurantCode?: string;
}

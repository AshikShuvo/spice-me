import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListTableReservationsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter: reservation starts on or after this instant (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startsFrom?: string;

  @ApiPropertyOptional({
    description:
      'Filter: reservation starts on or before this instant (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startsTo?: string;
}

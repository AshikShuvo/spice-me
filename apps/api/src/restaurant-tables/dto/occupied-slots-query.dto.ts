import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class OccupiedSlotsQueryDto {
  @ApiProperty({ description: 'Window start (ISO 8601)' })
  @IsDateString()
  from!: string;

  @ApiProperty({
    description: 'Window end (ISO 8601), exclusive of empty range',
  })
  @IsDateString()
  to!: string;
}

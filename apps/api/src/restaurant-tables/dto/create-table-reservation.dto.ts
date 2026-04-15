import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTableReservationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  tableId!: string;

  @ApiProperty({ description: 'ISO 8601 datetime (UTC recommended)' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'ISO 8601 datetime (UTC recommended)' })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  partySize!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Spice Central' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '123 Main St, Oslo' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @ApiProperty({ example: 59.9139 })
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 10.7522 })
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ example: 'Europe/Oslo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone!: string;

  @ApiProperty({ example: '07:00', description: 'Opening time in UTC (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'openingTime must be HH:MM in UTC',
  })
  openingTime!: string;

  @ApiProperty({ example: '20:00', description: 'Closing time in UTC (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'closingTime must be HH:MM in UTC',
  })
  closingTime!: string;
}

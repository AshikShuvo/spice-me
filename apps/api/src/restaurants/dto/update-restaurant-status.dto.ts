import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateRestaurantStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

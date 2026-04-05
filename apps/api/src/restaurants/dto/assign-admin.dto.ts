import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignAdminDto {
  @ApiProperty({ description: 'User id with role RESTAURANT_ADMIN' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

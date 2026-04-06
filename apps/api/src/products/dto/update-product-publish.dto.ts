import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProductPublishDto {
  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;
}

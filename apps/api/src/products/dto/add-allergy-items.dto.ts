import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddAllergyItemsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  allergyItemIds!: string[];
}

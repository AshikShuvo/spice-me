import { PartialType } from '@nestjs/swagger';
import { CreateAllergyItemDto } from './create-allergy-item.dto.js';

export class UpdateAllergyItemDto extends PartialType(CreateAllergyItemDto) {}

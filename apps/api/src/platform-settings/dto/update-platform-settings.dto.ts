import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

/** ISO 4217 — extend as needed for admin UI. */
export const PLATFORM_CURRENCY_CODES = [
  'EUR',
  'GBP',
  'NOK',
  'SEK',
  'DKK',
  'USD',
  'CHF',
  'PLN',
] as const;

export type PlatformCurrencyCode = (typeof PLATFORM_CURRENCY_CODES)[number];

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 15, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  foodVatPercent?: number;

  @ApiPropertyOptional({ example: 'EUR', enum: PLATFORM_CURRENCY_CODES })
  @IsOptional()
  @IsIn([...PLATFORM_CURRENCY_CODES])
  currencyCode?: PlatformCurrencyCode;
}

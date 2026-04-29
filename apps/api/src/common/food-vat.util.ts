import { Decimal } from '@prisma/client/runtime/client';
import type {
  OptionalIngredientProfile,
  ProductIngredientLinkProfile,
  ProductPriceDisplay,
  ProductProfile,
  ProductVariantProfile,
} from '../products/products.service.js';

function mulPrice(
  s: string | null | undefined,
  factor: Decimal,
): string | null {
  if (s === null || s === undefined || s === '') return null;
  return new Decimal(s).mul(factor).toDecimalPlaces(2).toString();
}

function scaleOptionalIngredient(
  o: OptionalIngredientProfile,
  factor: Decimal,
): OptionalIngredientProfile {
  return {
    ...o,
    extraPrice: mulPrice(o.extraPrice, factor) ?? o.extraPrice,
  };
}

function scaleIngredientLink(
  l: ProductIngredientLinkProfile,
  factor: Decimal,
): ProductIngredientLinkProfile {
  return {
    ...l,
    extraPrice: l.extraPrice === null ? null : mulPrice(l.extraPrice, factor),
  };
}

function scaleVariant(
  v: ProductVariantProfile,
  factor: Decimal,
): ProductVariantProfile {
  return {
    ...v,
    regularPrice: mulPrice(v.regularPrice, factor) ?? v.regularPrice,
    offerPrice: mulPrice(v.offerPrice, factor),
  };
}

function scaleDisplay(
  d: ProductPriceDisplay,
  factor: Decimal,
): ProductPriceDisplay {
  return {
    regularPrice: mulPrice(d.regularPrice, factor),
    offerPrice: mulPrice(d.offerPrice, factor),
  };
}

/** Customer-facing: multiply all price strings by (1 + VAT/100) unless product is VAT-exclusive. */
export function applyFoodVatToProfile(
  profile: ProductProfile,
  foodVatPercent: string | number,
): ProductProfile {
  if (profile.isVatExclusive) {
    return profile;
  }
  const pct = new Decimal(foodVatPercent);
  const factor = new Decimal(1).add(pct.div(100));

  return {
    ...profile,
    pricing: {
      hasVariants: profile.pricing.hasVariants,
      regularPrice: mulPrice(profile.pricing.regularPrice, factor),
      offerPrice: mulPrice(profile.pricing.offerPrice, factor),
      display: scaleDisplay(profile.pricing.display, factor),
      variants: profile.pricing.variants.map((v) => scaleVariant(v, factor)),
    },
    optionalIngredients: (profile.optionalIngredients ?? []).map((o) =>
      scaleOptionalIngredient(o, factor),
    ),
    ingredientLinks: (profile.ingredientLinks ?? []).map((l) =>
      scaleIngredientLink(l, factor),
    ),
  };
}

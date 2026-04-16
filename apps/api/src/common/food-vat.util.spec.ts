import { describe, expect, it } from '@jest/globals';
import { applyFoodVatToProfile } from './food-vat.util.js';
import type { ProductProfile } from '../products/products.service.js';

function baseProfile(overrides: Partial<ProductProfile> = {}): ProductProfile {
  return {
    id: 'p1',
    title: 'T',
    description: 'D',
    imageUrl: 'u',
    categoryId: 'c1',
    subCategoryId: null,
    isPublished: true,
    isActive: true,
    isVatExclusive: false,
    category: { id: 'c1', name: 'Cat' },
    subCategory: null,
    pricing: {
      hasVariants: false,
      regularPrice: '100.00',
      offerPrice: null,
      display: { regularPrice: '100.00', offerPrice: null },
      variants: [],
    },
    allergyItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('applyFoodVatToProfile', () => {
  it('applies 15% VAT to product-level prices', () => {
    const out = applyFoodVatToProfile(baseProfile(), 15);
    expect(out.pricing.display.regularPrice).toBe('115');
    expect(out.pricing.regularPrice).toBe('115');
    expect(out.pricing.offerPrice).toBeNull();
  });

  it('applies VAT to offer and regular', () => {
    const p = baseProfile({
      pricing: {
        hasVariants: false,
        regularPrice: '100.00',
        offerPrice: '80.00',
        display: { regularPrice: '100.00', offerPrice: '80.00' },
        variants: [],
      },
    });
    const out = applyFoodVatToProfile(p, 10);
    expect(out.pricing.display.offerPrice).toBe('88');
    expect(out.pricing.display.regularPrice).toBe('110');
  });

  it('leaves prices unchanged when isVatExclusive', () => {
    const p = baseProfile({
      isVatExclusive: true,
      pricing: {
        hasVariants: false,
        regularPrice: '100.00',
        offerPrice: null,
        display: { regularPrice: '100.00', offerPrice: null },
        variants: [],
      },
    });
    const out = applyFoodVatToProfile(p, 25);
    expect(out.pricing.display.regularPrice).toBe('100.00');
  });

  it('scales variant rows', () => {
    const p = baseProfile({
      pricing: {
        hasVariants: true,
        regularPrice: null,
        offerPrice: null,
        display: { regularPrice: '10.00', offerPrice: null },
        variants: [
          {
            id: 'v1',
            name: 'S',
            sortOrder: 0,
            regularPrice: '10',
            offerPrice: null,
            isActive: true,
            isDefault: true,
          },
        ],
      },
    });
    const out = applyFoodVatToProfile(p, 100);
    expect(out.pricing.variants[0].regularPrice).toBe('20');
    expect(out.pricing.display.regularPrice).toBe('20');
  });
});

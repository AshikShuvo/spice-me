-- Rename product pricing columns
ALTER TABLE "Product" RENAME COLUMN "basePrice" TO "regularPrice";
ALTER TABLE "Product" RENAME COLUMN "salePrice" TO "offerPrice";

-- Rename variant pricing columns
ALTER TABLE "ProductVariant" RENAME COLUMN "basePrice" TO "regularPrice";
ALTER TABLE "ProductVariant" RENAME COLUMN "salePrice" TO "offerPrice";

-- Default variant flag
ALTER TABLE "ProductVariant" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- One default per product that has variants: lowest sortOrder, then id
UPDATE "ProductVariant" pv
SET "isDefault" = true
FROM (
  SELECT DISTINCT ON ("productId") id
  FROM "ProductVariant"
  ORDER BY "productId", "sortOrder" ASC, id ASC
) pick
WHERE pv.id = pick.id;

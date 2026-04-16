-- CreateTable
CREATE TABLE "PlatformCommonSettings" (
    "id" TEXT NOT NULL,
    "foodVatPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCommonSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformCommonSettings" ("id", "foodVatPercent", "currencyCode", "createdAt", "updatedAt")
VALUES ('default', 0, 'EUR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Product" ADD COLUMN "isVatExclusive" BOOLEAN NOT NULL DEFAULT false;

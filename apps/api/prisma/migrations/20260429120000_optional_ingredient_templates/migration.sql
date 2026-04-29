-- AlterTable
ALTER TABLE "Product" ADD COLUMN "maxOptionalIngredients" INTEGER;

-- AlterTable
ALTER TABLE "ProductIngredient" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "IngredientTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "extraPrice" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngredientTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngredientTemplateItem_templateId_idx" ON "IngredientTemplateItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientTemplateItem_templateId_ingredientId_key" ON "IngredientTemplateItem"("templateId", "ingredientId");

-- AddForeignKey
ALTER TABLE "IngredientTemplateItem" ADD CONSTRAINT "IngredientTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientTemplateItem" ADD CONSTRAINT "IngredientTemplateItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

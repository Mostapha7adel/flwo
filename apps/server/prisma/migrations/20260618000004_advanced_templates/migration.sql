-- AlterTable: Template
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='templateType') THEN ALTER TABLE "templates" ADD COLUMN "templateType" VARCHAR(30); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='framework') THEN ALTER TABLE "templates" ADD COLUMN "framework" VARCHAR(50); END IF;
END $$;

-- CreateTable: TemplateField
CREATE TABLE IF NOT EXISTS "template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "options" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TemplateAsset
CREATE TABLE IF NOT EXISTS "template_assets" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "url" TEXT NOT NULL,
    "label" VARCHAR(200),
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TemplateReview
CREATE TABLE IF NOT EXISTS "template_reviews" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomerProject
CREATE TABLE IF NOT EXISTS "customer_projects" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "previewUrl" TEXT,
    "publishedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "template_fields_templateId_key_key" ON "template_fields"("templateId", "key");
CREATE INDEX "template_fields_templateId_idx" ON "template_fields"("templateId");
CREATE INDEX "template_assets_templateId_idx" ON "template_assets"("templateId");
CREATE INDEX "template_assets_type_idx" ON "template_assets"("type");
CREATE UNIQUE INDEX "template_reviews_templateId_userId_key" ON "template_reviews"("templateId", "userId");
CREATE INDEX "template_reviews_templateId_idx" ON "template_reviews"("templateId");
CREATE INDEX "template_reviews_rating_idx" ON "template_reviews"("rating");
CREATE UNIQUE INDEX "customer_projects_orderId_key" ON "customer_projects"("orderId");
CREATE INDEX "customer_projects_userId_idx" ON "customer_projects"("userId");
CREATE INDEX "customer_projects_templateId_idx" ON "customer_projects"("templateId");

-- AddForeignKeys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='template_fields_templateId_fkey') THEN
    ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='template_assets_templateId_fkey') THEN
    ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='template_reviews_templateId_fkey') THEN
    ALTER TABLE "template_reviews" ADD CONSTRAINT "template_reviews_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='template_reviews_userId_fkey') THEN
    ALTER TABLE "template_reviews" ADD CONSTRAINT "template_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='customer_projects_orderId_fkey') THEN
    ALTER TABLE "customer_projects" ADD CONSTRAINT "customer_projects_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='customer_projects_userId_fkey') THEN
    ALTER TABLE "customer_projects" ADD CONSTRAINT "customer_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='customer_projects_templateId_fkey') THEN
    ALTER TABLE "customer_projects" ADD CONSTRAINT "customer_projects_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

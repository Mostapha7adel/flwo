-- CreateEnum
CREATE TYPE "DeploymentType" AS ENUM ('DOWNLOAD', 'MANUAL', 'AUTO_SSH', 'AUTO_DOCKER', 'AUTO_GIT');
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- AlterEnum (OrderStatus already exists, no change needed)

-- AlterTable: Template
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='configSchema') THEN ALTER TABLE "templates" ADD COLUMN "configSchema" JSONB; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='gallery') THEN ALTER TABLE "templates" ADD COLUMN "gallery" TEXT[] DEFAULT '{}'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='videoUrl') THEN ALTER TABLE "templates" ADD COLUMN "videoUrl" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='features') THEN ALTER TABLE "templates" ADD COLUMN "features" JSONB; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='deploymentType') THEN ALTER TABLE "templates" ADD COLUMN "deploymentType" VARCHAR(20); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='deploymentScript') THEN ALTER TABLE "templates" ADD COLUMN "deploymentScript" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='sourceUrl') THEN ALTER TABLE "templates" ADD COLUMN "sourceUrl" TEXT; END IF;
END $$;

-- CreateTable: TemplateVersion
CREATE TABLE IF NOT EXISTS "template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "changelog" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Server
CREATE TABLE IF NOT EXISTS "servers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 22,
    "username" VARCHAR(100) NOT NULL,
    "authType" VARCHAR(20) NOT NULL DEFAULT 'PASSWORD',
    "password" TEXT,
    "sshKey" TEXT,
    "domain" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Deployment
CREATE TABLE IF NOT EXISTS "deployments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "serverId" TEXT,
    "type" "DeploymentType" NOT NULL DEFAULT 'DOWNLOAD',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "domain" VARCHAR(255),
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "log" TEXT,
    "deployedVersion" VARCHAR(20),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Subscription
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "maxTemplates" INTEGER NOT NULL DEFAULT 1,
    "maxDeployments" INTEGER NOT NULL DEFAULT 0,
    "maxServers" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "stripeId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "template_versions_templateId_version_key" ON "template_versions"("templateId", "version");
CREATE INDEX "template_versions_templateId_idx" ON "template_versions"("templateId");
CREATE INDEX "servers_userId_idx" ON "servers"("userId");
CREATE UNIQUE INDEX "deployments_orderId_key" ON "deployments"("orderId");
CREATE INDEX "deployments_status_idx" ON "deployments"("status");
CREATE INDEX "deployments_serverId_idx" ON "deployments"("serverId");
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- AddForeignKeys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='template_versions_templateId_fkey') THEN
    ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='servers_userId_fkey') THEN
    ALTER TABLE "servers" ADD CONSTRAINT "servers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='deployments_orderId_fkey') THEN
    ALTER TABLE "deployments" ADD CONSTRAINT "deployments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='deployments_serverId_fkey') THEN
    ALTER TABLE "deployments" ADD CONSTRAINT "deployments_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='subscriptions_userId_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

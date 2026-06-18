-- CreateIndex (IF NOT EXISTS for safety on transitional databases)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_createdAt_idx') THEN
    CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_role_isActive_idx') THEN
    CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'templates_createdAt_idx') THEN
    CREATE INDEX "templates_createdAt_idx" ON "templates"("createdAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'templates_category_isPublished_idx') THEN
    CREATE INDEX "templates_category_isPublished_idx" ON "templates"("category", "isPublished");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_userId_status_idx') THEN
    CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_status_createdAt_idx') THEN
    CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
  END IF;
END $$;

-- Soft delete: add deletedAt columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deletedAt') THEN
    ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates' AND column_name='deletedAt') THEN
    ALTER TABLE "templates" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='deletedAt') THEN
    ALTER TABLE "conversations" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='deletedAt') THEN
    ALTER TABLE "expenses" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
END $$;

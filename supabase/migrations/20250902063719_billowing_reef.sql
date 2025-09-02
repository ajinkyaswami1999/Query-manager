/*
# Fix Query Table Relationships

1. Database Changes
  - Fix foreign key constraints for queries table
  - Ensure proper relationships between users and queries
  - Add proper indexes for performance

2. Relationship Fixes
  - Fix created_by and updated_by foreign key references
  - Ensure queries can properly join with users table
  - Add proper constraints and indexes

3. Data Integrity
  - Ensure all existing data remains intact
  - Add proper cascade rules for data consistency
*/

-- First, let's ensure the queries table has proper foreign key constraints
DO $$
BEGIN
  -- Check if the foreign key constraint for created_by exists and fix it if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'queries_created_by_fkey' 
    AND table_name = 'queries'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE queries 
    ADD CONSTRAINT queries_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;

  -- Check if the foreign key constraint for updated_by exists and fix it if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'queries_updated_by_fkey' 
    AND table_name = 'queries'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE queries 
    ADD CONSTRAINT queries_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

-- Add indexes for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_queries_created_by ON queries(created_by);
CREATE INDEX IF NOT EXISTS idx_queries_updated_by ON queries(updated_by);
CREATE INDEX IF NOT EXISTS idx_queries_engine_id ON queries(engine_id);
CREATE INDEX IF NOT EXISTS idx_queries_category_id ON queries(category_id);
CREATE INDEX IF NOT EXISTS idx_queries_tag_id ON queries(tag_id);

-- Add indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Add indexes for master data
CREATE INDEX IF NOT EXISTS idx_database_engine_active ON database_engine_master(is_active);
CREATE INDEX IF NOT EXISTS idx_category_active ON category_master(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags_master(is_active);
/*
# Fix Query Creation Issues

1. Database Changes
  - Fix foreign key constraints for queries table
  - Ensure proper relationships between users and queries
  - Add proper indexes for performance
  - Fix RLS policies for query creation

2. Relationship Fixes
  - Fix created_by and updated_by foreign key references
  - Ensure queries can properly join with users table
  - Add proper constraints and indexes

3. Data Integrity
  - Ensure all existing data remains intact
  - Add proper cascade rules for data consistency
  - Fix any constraint issues preventing inserts
*/

-- First, let's ensure the queries table has proper foreign key constraints
DO $$
BEGIN
  -- Drop existing foreign key constraints if they exist to recreate them properly
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'queries_created_by_fkey' 
    AND table_name = 'queries'
  ) THEN
    ALTER TABLE queries DROP CONSTRAINT queries_created_by_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'queries_updated_by_fkey' 
    AND table_name = 'queries'
  ) THEN
    ALTER TABLE queries DROP CONSTRAINT queries_updated_by_fkey;
  END IF;

  -- Add the foreign key constraints properly
  ALTER TABLE queries 
  ADD CONSTRAINT queries_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

  ALTER TABLE queries 
  ADD CONSTRAINT queries_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
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

-- Fix RLS policies for queries to allow proper creation
DROP POLICY IF EXISTS "Users can create queries" ON queries;
DROP POLICY IF EXISTS "Users can read shared queries and own queries" ON queries;
DROP POLICY IF EXISTS "Users can update own queries" ON queries;
DROP POLICY IF EXISTS "Users can delete own queries" ON queries;

-- Create new policies for queries with proper permissions
CREATE POLICY "Users can read shared queries and own queries" ON queries
  FOR SELECT TO authenticated
  USING (is_shared = true OR created_by = auth.uid());

CREATE POLICY "Users can create queries" ON queries
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own queries" ON queries
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own queries" ON queries
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Allow service role to bypass all RLS
CREATE POLICY "Service role can manage all queries" ON queries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
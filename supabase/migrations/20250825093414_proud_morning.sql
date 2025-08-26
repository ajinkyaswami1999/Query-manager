/*
# Query Management System Database Schema

1. New Tables
  - `roles` - User role definitions (Admin, User)
  - `user_rights` - Available system permissions
  - `users` - Application users with role and permissions
  - `database_engine_master` - Supported database engines
  - `category_master` - Query categories
  - `tags_master` - Query tags
  - `queries` - Main query storage table
  - `user_role_rights` - Junction table for user permissions

2. Security
  - Enable RLS on all tables
  - Policies for role-based access control
  - Admin-only access for master data management
  - User isolation for queries and personal data

3. Features
  - Comprehensive user management
  - Hierarchical permission system
  - Master data management
  - Query versioning and tracking
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user rights table
CREATE TABLE IF NOT EXISTS user_rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  right_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  role_id uuid REFERENCES roles(id) DEFAULT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_role_rights junction table
CREATE TABLE IF NOT EXISTS user_role_rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  right_id uuid REFERENCES user_rights(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, right_id)
);

-- Create database engine master table
CREATE TABLE IF NOT EXISTS database_engine_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create category master table
CREATE TABLE IF NOT EXISTS category_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tags master table
CREATE TABLE IF NOT EXISTS tags_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name text NOT NULL,
  engine_id uuid REFERENCES database_engine_master(id),
  category_id uuid REFERENCES category_master(id),
  tag_id uuid REFERENCES tags_master(id),
  query_text text NOT NULL,
  description text DEFAULT '',
  is_shared boolean DEFAULT false,
  created_by uuid REFERENCES users(id) NOT NULL,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_engine_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Create policies for roles (admin only)
CREATE POLICY "Admin can manage roles" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

-- Create policies for user_rights (admin only)
CREATE POLICY "Admin can manage user rights" ON user_rights
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

-- Create policies for users
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

-- Create policies for user_role_rights
CREATE POLICY "Users can read their own rights" ON user_role_rights
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can manage user rights" ON user_role_rights
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

-- Create policies for master data tables (admin only for write, all authenticated for read)
CREATE POLICY "All can read database engines" ON database_engine_master
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage database engines" ON database_engine_master
  FOR INSERT, UPDATE, DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "All can read categories" ON category_master
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage categories" ON category_master
  FOR INSERT, UPDATE, DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "All can read tags" ON tags_master
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage tags" ON tags_master
  FOR INSERT, UPDATE, DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.role_name = 'Admin'
    )
  );

-- Create policies for queries
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

-- Insert default data
INSERT INTO roles (role_name, description) VALUES 
  ('Admin', 'System administrator with full access'),
  ('User', 'Regular user with limited access')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_rights (right_name, description) VALUES 
  ('CREATE_QUERY', 'Can create new queries'),
  ('UPDATE_QUERY', 'Can update existing queries'),
  ('DELETE_QUERY', 'Can delete queries'),
  ('SHARE_QUERY', 'Can share queries with others'),
  ('CREATE_USER', 'Can create new users'),
  ('MANAGE_MASTERS', 'Can manage master data'),
  ('VIEW_ADMIN_PANEL', 'Can access admin panel')
ON CONFLICT (right_name) DO NOTHING;

INSERT INTO database_engine_master (engine_name, description) VALUES 
  ('MySQL', 'MySQL Database Engine'),
  ('PostgreSQL', 'PostgreSQL Database Engine'),
  ('MongoDB', 'MongoDB NoSQL Database'),
  ('SQL Server', 'Microsoft SQL Server'),
  ('Oracle', 'Oracle Database'),
  ('SQLite', 'SQLite Database')
ON CONFLICT (engine_name) DO NOTHING;

INSERT INTO category_master (category_name, description) VALUES 
  ('Analytics', 'Data analytics and reporting queries'),
  ('CRUD Operations', 'Create, Read, Update, Delete operations'),
  ('Performance', 'Performance optimization queries'),
  ('Maintenance', 'Database maintenance scripts'),
  ('Migration', 'Data migration scripts')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO tags_master (tag_name, description) VALUES 
  ('Production', 'Production environment queries'),
  ('Development', 'Development environment queries'),
  ('Testing', 'Testing and QA queries'),
  ('Optimization', 'Performance optimization'),
  ('Backup', 'Backup and restore operations')
ON CONFLICT (tag_name) DO NOTHING;
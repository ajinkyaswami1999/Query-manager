/*
# Create Admin User

1. Admin User Creation
  - Create default admin user with secure credentials
  - Assign admin role and full permissions
  - Create default user for demonstration

2. User Rights Assignment
  - Grant all rights to admin user
  - Grant basic rights to demo user

3. Demo Data
  - Sample queries for demonstration
  - Default admin credentials: admin@example.com / Admin123!@#$4567
  - Default user credentials: user@example.com / User123!@#$4567
*/

-- Get role IDs
DO $$
DECLARE
  admin_role_id uuid;
  user_role_id uuid;
  admin_user_id uuid;
  demo_user_id uuid;
  right_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE role_name = 'Admin';
  SELECT id INTO user_role_id FROM roles WHERE role_name = 'User';

  -- Create admin user
  INSERT INTO users (id, role_id, name, email, password_hash, is_active)
  VALUES (
    gen_random_uuid(),
    admin_role_id,
    'System Administrator',
    'admin@example.com',
    'Admin123!@#$4567',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active
  RETURNING id INTO admin_user_id;

  -- Get admin user ID if already exists
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';
  END IF;

  -- Create demo user
  INSERT INTO users (id, role_id, name, email, password_hash, is_active)
  VALUES (
    gen_random_uuid(),
    user_role_id,
    'Demo User',
    'user@example.com',
    'User123!@#$4567',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active
  RETURNING id INTO demo_user_id;

  -- Get demo user ID if already exists
  IF demo_user_id IS NULL THEN
    SELECT id INTO demo_user_id FROM users WHERE email = 'user@example.com';
  END IF;

  -- Delete existing rights for admin user
  DELETE FROM user_role_rights WHERE user_id = admin_user_id;
  
  -- Assign all rights to admin user
  FOR right_id IN SELECT id FROM user_rights LOOP
    INSERT INTO user_role_rights (user_id, right_id)
    VALUES (admin_user_id, right_id)
    ON CONFLICT (user_id, right_id) DO NOTHING;
  END LOOP;

  -- Delete existing rights for demo user
  DELETE FROM user_role_rights WHERE user_id = demo_user_id;

  -- Assign basic rights to demo user
  FOR right_id IN SELECT id FROM user_rights WHERE right_name IN ('CREATE_QUERY', 'UPDATE_QUERY', 'SHARE_QUERY') LOOP
    INSERT INTO user_role_rights (user_id, right_id)
    VALUES (demo_user_id, right_id)
    ON CONFLICT (user_id, right_id) DO NOTHING;
  END LOOP;

  -- Create sample queries for demo
  INSERT INTO queries (query_name, engine_id, category_id, tag_id, query_text, description, is_shared, created_by)
  SELECT 
    'Get All Users',
    (SELECT id FROM database_engine_master WHERE engine_name = 'PostgreSQL' LIMIT 1),
    (SELECT id FROM category_master WHERE category_name = 'CRUD Operations' LIMIT 1),
    (SELECT id FROM tags_master WHERE tag_name = 'Production' LIMIT 1),
    'SELECT * FROM users ORDER BY created_at DESC;',
    'Retrieve all users from the database ordered by creation date',
    true,
    admin_user_id
  ON CONFLICT DO NOTHING;

  INSERT INTO queries (query_name, engine_id, category_id, tag_id, query_text, description, is_shared, created_by)
  SELECT 
    'User Analytics',
    (SELECT id FROM database_engine_master WHERE engine_name = 'PostgreSQL' LIMIT 1),
    (SELECT id FROM category_master WHERE category_name = 'Analytics' LIMIT 1),
    (SELECT id FROM tags_master WHERE tag_name = 'Production' LIMIT 1),
    'SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
      COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
    FROM users;',
    'Get user statistics including total, active, and inactive counts',
    true,
    admin_user_id
  ON CONFLICT DO NOTHING;

END $$;
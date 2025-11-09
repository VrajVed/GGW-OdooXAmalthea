-- ============================================================================
-- Create Sample Employee User
-- ============================================================================
-- This script creates a sample employee (team member) user for testing
--
-- Credentials:
--   Email: employee@ggw.com
--   Password: employee123
-- ============================================================================

-- Insert sample employee user
INSERT INTO auth.users (
  org_id, 
  email, 
  full_name, 
  password_hash, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'employee@ggw.com',
  'John Employee',
  -- Password hash for 'employee123' using bcrypt (salt rounds = 12)
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWZ7cL0ILGhi',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'employee@ggw.com'
);

-- Assign team_member role to the employee
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT 
  u.org_id,
  u.id,
  'team_member'::auth.role_type
FROM auth.users u
WHERE u.email = 'employee@ggw.com'
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- Verify the user was created
SELECT 
  u.email,
  u.full_name,
  ur.role,
  u.is_active
FROM auth.users u
LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'employee@ggw.com';

-- ============================================================================
-- SAMPLE CREDENTIALS SUMMARY
-- ============================================================================
-- Email: employee@ggw.com
-- Password: employee123
-- Role: team_member (Employee)
-- Expected Redirect: /employee
-- ============================================================================

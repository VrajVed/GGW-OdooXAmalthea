-- ============================================================================
-- Assign User Roles Script
-- ============================================================================
-- Use this script to assign roles to existing users in your database
-- ============================================================================

-- Example 1: Make a specific user a Project Manager
-- Replace 'user@example.com' with the actual email
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT org_id, id, 'project_manager'::auth.role_type
FROM auth.users
WHERE email = 'manager@example.com'
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- Example 2: Make a specific user an Admin
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT org_id, id, 'admin'::auth.role_type
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- Example 3: Make a specific user a Team Member (Employee)
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT org_id, id, 'team_member'::auth.role_type
FROM auth.users
WHERE email = 'employee@example.com'
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- Example 4: Make a specific user a Finance role
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT org_id, id, 'finance'::auth.role_type
FROM auth.users
WHERE email = 'finance@example.com'
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- ============================================================================
-- Assign ALL existing users without a role as team_member (default)
-- ============================================================================
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT u.org_id, u.id, 'team_member'::auth.role_type
FROM auth.users u
LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (org_id, user_id, role) DO NOTHING;

-- ============================================================================
-- View all users and their roles
-- ============================================================================
SELECT 
    u.email,
    u.full_name,
    COALESCE(ur.role::text, 'No Role Assigned') as role,
    u.is_active
FROM auth.users u
LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
ORDER BY u.email;

-- ============================================================================
-- Change a user's role (remove old role and add new one)
-- ============================================================================
-- Example: Change user from team_member to project_manager
-- Step 1: Remove existing role
DELETE FROM auth.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Step 2: Add new role
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT org_id, id, 'project_manager'::auth.role_type
FROM auth.users
WHERE email = 'user@example.com';

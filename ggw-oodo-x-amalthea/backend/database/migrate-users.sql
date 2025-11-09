-- ============================================================
-- Migration Script: Link public.users to auth.users
-- ============================================================
-- This script migrates existing users from the simple auth
-- system (public.users) to the OneFlow multi-tenant system
-- (auth.users) while maintaining backward compatibility.
-- ============================================================

BEGIN;

-- Step 1: Ensure we have at least one organization
-- (Using ACME Corp if it exists, or create a default one)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Try to get existing ACME Corp
    SELECT id INTO v_org_id FROM auth.orgs WHERE slug = 'acme' LIMIT 1;
    
    -- If no org exists, create a default one
    IF v_org_id IS NULL THEN
        INSERT INTO auth.orgs (name, slug, base_currency, default_timezone)
        VALUES ('Default Organization', 'default-org', 'USD', 'America/New_York')
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created default organization: %', v_org_id;
    ELSE
        RAISE NOTICE 'Using existing organization: %', v_org_id;
    END IF;
END $$;

-- Step 2: Migrate users from public.users to auth.users
-- Only migrate users that don't already exist in auth.users
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
    (SELECT id FROM auth.orgs WHERE slug IN ('acme', 'default-org') LIMIT 1) as org_id,
    pu.work_email as email,
    pu.first_name || ' ' || pu.last_name as full_name,
    pu.password_hash,
    pu.is_active,
    pu.created_at,
    pu.updated_at
FROM public.users pu
WHERE NOT EXISTS (
    -- Don't duplicate if user already exists in auth.users
    SELECT 1 FROM auth.users au 
    WHERE au.email = pu.work_email 
    AND au.org_id = (SELECT id FROM auth.orgs WHERE slug IN ('acme', 'default-org') LIMIT 1)
)
ON CONFLICT (org_id, email) DO NOTHING;

-- Step 3: Assign default roles to migrated users
-- Map old roles to new role system (admin, project_manager, team_member, finance)
INSERT INTO auth.user_roles (org_id, user_id, role)
SELECT 
    au.org_id,
    au.id as user_id,
    CASE pu.role
        WHEN 'admin' THEN 'admin'::auth.role_type
        WHEN 'manager' THEN 'project_manager'::auth.role_type
        WHEN 'user' THEN 'team_member'::auth.role_type
        WHEN 'guest' THEN 'team_member'::auth.role_type
        ELSE 'team_member'::auth.role_type
    END as role
FROM public.users pu
JOIN auth.users au ON au.email = pu.work_email
WHERE au.org_id = (SELECT id FROM auth.orgs WHERE slug IN ('acme', 'default-org') LIMIT 1)
AND NOT EXISTS (
    -- Don't duplicate role assignments
    SELECT 1 FROM auth.user_roles ur WHERE ur.user_id = au.id AND ur.org_id = au.org_id
);

-- Step 4: Add a migration metadata column to public.users (optional)
-- This helps track which users have been migrated
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS migrated_to_auth_user_id UUID;

-- Update the reference
UPDATE public.users pu
SET migrated_to_auth_user_id = au.id
FROM auth.users au
WHERE au.email = pu.work_email
AND au.org_id = (SELECT id FROM auth.orgs WHERE slug IN ('acme', 'default-org') LIMIT 1)
AND pu.migrated_to_auth_user_id IS NULL;

-- Step 5: Display migration results
DO $$
DECLARE
    v_org_count INT;
    v_public_user_count INT;
    v_auth_user_count INT;
    v_migrated_count INT;
    v_org_id UUID;
    v_org_name TEXT;
BEGIN
    -- Count organizations
    SELECT COUNT(*) INTO v_org_count FROM auth.orgs;
    
    -- Get the org we're using
    SELECT id, name INTO v_org_id, v_org_name 
    FROM auth.orgs 
    WHERE slug IN ('acme', 'default-org') 
    LIMIT 1;
    
    -- Count users
    SELECT COUNT(*) INTO v_public_user_count FROM public.users;
    SELECT COUNT(*) INTO v_auth_user_count FROM auth.users WHERE org_id = v_org_id;
    SELECT COUNT(*) INTO v_migrated_count 
    FROM public.users 
    WHERE migrated_to_auth_user_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Organization: % (ID: %)', v_org_name, v_org_id;
    RAISE NOTICE 'Total Organizations: %', v_org_count;
    RAISE NOTICE 'Users in public.users: %', v_public_user_count;
    RAISE NOTICE 'Users in auth.users (this org): %', v_auth_user_count;
    RAISE NOTICE 'Successfully migrated: %', v_migrated_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Step 6: Display sample of migrated users
SELECT 
    pu.work_email as original_email,
    pu.first_name || ' ' || pu.last_name as original_name,
    pu.role as old_role,
    au.id as new_auth_user_id,
    au.full_name as new_name,
    (SELECT string_agg(role::text, ', ') FROM auth.user_roles WHERE user_id = au.id) as new_roles,
    CASE WHEN pu.migrated_to_auth_user_id IS NOT NULL THEN '✓' ELSE '✗' END as migrated
FROM public.users pu
LEFT JOIN auth.users au ON au.email = pu.work_email
ORDER BY pu.created_at;

COMMIT;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. This script maintains backward compatibility - your 
--    public.users table is NOT deleted or modified (except 
--    for adding a tracking column)
--
-- 2. Users can now be accessed from both systems:
--    - Old routes can continue using public.users
--    - New routes can use auth.users
--
-- 3. To fully migrate authentication to the new system,
--    you'll need to update routes/users.js to query
--    auth.users instead of public.users
--
-- 4. The migrated_to_auth_user_id column in public.users
--    maintains the link between old and new user records
-- ============================================================

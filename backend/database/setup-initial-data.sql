-- =========================
-- Setup Initial Data for Project Management
-- =========================
-- This script creates an organization and sample data

-- Create a default organization if it doesn't exist
INSERT INTO auth.orgs (name, slug, base_currency, default_timezone, is_active)
VALUES ('Default Organization', 'default-org', 'USD', 'UTC', true)
ON CONFLICT (slug) DO NOTHING;

-- Get the org ID for reference
DO $$
DECLARE
  org_uuid UUID;
BEGIN
  SELECT id INTO org_uuid FROM auth.orgs WHERE slug = 'default-org';
  
  -- Create sample users in auth.users if they don't exist
  INSERT INTO auth.users (org_id, email, full_name, email_verified_at, is_active)
  VALUES 
    (org_uuid, 'gaurav@example.com', 'Gaurav', NOW(), true),
    (org_uuid, 'drashti@example.com', 'Drashti', NOW(), true)
  ON CONFLICT (org_id, email) DO NOTHING;
  
  RAISE NOTICE 'Initial setup completed successfully!';
END $$;

-- Verify the setup
SELECT 
  'Organization' as type, 
  name, 
  slug, 
  base_currency 
FROM auth.orgs 
WHERE slug = 'default-org';

SELECT 
  'Users' as type,
  email, 
  full_name, 
  is_active 
FROM auth.users 
WHERE org_id = (SELECT id FROM auth.orgs WHERE slug = 'default-org');

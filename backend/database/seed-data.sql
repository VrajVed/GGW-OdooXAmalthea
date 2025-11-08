-- ============================================================================
-- Seed Data for GGW Odoo Application
-- ============================================================================

-- Create a default organization
INSERT INTO auth.orgs (id, name, slug, base_currency, default_timezone, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'GGW Organization', 'ggw-org', 'INR', 'Asia/Kolkata', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt with salt rounds = 10
INSERT INTO auth.users (
  id, org_id, email, full_name, password_hash, is_active, 
  created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@ggw.com', 
    'Admin User', 
    '$2b$10$YourHashHere.Replace.This.With.Actual.Bcrypt.Hash.For.admin123', 
    true, 
    NOW(), 
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample projects with different statuses
INSERT INTO project.projects (
  org_id, code, name, description, status, manager_user_id,
  progress_mode, progress_pct, start_date, end_date,
  tags, created_at, updated_at
)
VALUES
  -- New Project
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PROJ-001',
    'Website Redesign',
    'Complete redesign of company website with modern UI/UX',
    'planned',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'manual',
    0,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY['web', 'design', 'urgent'],
    NOW(),
    NOW()
  ),
  -- In Progress Project
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PROJ-002',
    'Mobile App Development',
    'Develop cross-platform mobile application for customer engagement',
    'in_progress',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'manual',
    45,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '45 days',
    ARRAY['mobile', 'react-native', 'high-priority'],
    NOW(),
    NOW()
  ),
  -- In Progress Project
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PROJ-003',
    'Database Migration',
    'Migrate legacy database to PostgreSQL with data validation',
    'in_progress',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'manual',
    75,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '10 days',
    ARRAY['database', 'migration'],
    NOW(),
    NOW()
  ),
  -- Completed Project
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PROJ-004',
    'Security Audit',
    'Comprehensive security audit and penetration testing',
    'completed',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'manual',
    100,
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '5 days',
    ARRAY['security', 'audit'],
    NOW(),
    NOW()
  ),
  -- New Project
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PROJ-005',
    'API Integration',
    'Integrate third-party payment gateway APIs',
    'planned',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'manual',
    0,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '35 days',
    ARRAY['api', 'payment', 'integration'],
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Display summary
SELECT 
  'Organizations' as entity,
  COUNT(*) as count
FROM auth.orgs
UNION ALL
SELECT 
  'Users' as entity,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Projects' as entity,
  COUNT(*) as count
FROM project.projects;

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

-- Update all projects with default budget
UPDATE project.projects
SET budget_amount = 50000
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Create user rates for admin user
INSERT INTO project.user_rates (
  org_id, user_id, bill_rate, cost_rate, currency, valid_from
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    1500.00,  -- bill_rate: ₹1500/hour
    1000.00,  -- cost_rate: ₹1000/hour
    'INR',
    CURRENT_DATE - INTERVAL '90 days'
  )
ON CONFLICT (org_id, user_id, valid_from) DO NOTHING;

-- Create sample timesheet entries
-- Note: Using subqueries to get project IDs by code since UUIDs are auto-generated
INSERT INTO project.timesheets (
  org_id, project_id, user_id, worked_on, hours, is_billable, cost_rate, note, created_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  worked_date,
  hours_val,
  is_billable_val,
  1000.00,  -- cost_rate from user_rates
  note_val,
  NOW()
FROM project.projects p
CROSS JOIN (
  VALUES
    -- Website Redesign project (PROJ-001) - Approved entries
    ('PROJ-001', CURRENT_DATE - INTERVAL '5 days', 8.0, true, 'Completed homepage design'),
    ('PROJ-001', CURRENT_DATE - INTERVAL '4 days', 7.5, true, 'Worked on navigation component'),
    ('PROJ-001', CURRENT_DATE - INTERVAL '3 days', 6.0, true, 'Fixed responsive issues'),
    -- Mobile App Development (PROJ-002) - Mix of approved and pending
    ('PROJ-002', CURRENT_DATE - INTERVAL '10 days', 8.0, true, 'Setup React Native environment'),
    ('PROJ-002', CURRENT_DATE - INTERVAL '9 days', 7.0, true, 'Created login screen UI'),
    ('PROJ-002', CURRENT_DATE - INTERVAL '2 days', 6.5, false, 'Internal training session'),
    ('PROJ-002', CURRENT_DATE - INTERVAL '1 days', 8.0, true, 'Implemented authentication flow'),
    -- Database Migration (PROJ-003) - Pending entries
    ('PROJ-003', CURRENT_DATE - INTERVAL '7 days', 7.5, true, 'Analyzed legacy schema'),
    ('PROJ-003', CURRENT_DATE - INTERVAL '6 days', 8.0, true, 'Created migration scripts'),
    ('PROJ-003', CURRENT_DATE - INTERVAL '1 days', 6.0, true, 'Testing migration process'),
    -- Security Audit (PROJ-004) - Completed project
    ('PROJ-004', CURRENT_DATE - INTERVAL '30 days', 8.0, true, 'Vulnerability scanning'),
    ('PROJ-004', CURRENT_DATE - INTERVAL '29 days', 7.5, true, 'Penetration testing'),
    -- API Integration (PROJ-005) - New project
    ('PROJ-005', CURRENT_DATE, 4.0, true, 'Initial research and planning')
) AS timesheet_data(project_code, worked_date, hours_val, is_billable_val, note_val)
WHERE p.code = timesheet_data.project_code
ON CONFLICT DO NOTHING;

-- Approve some timesheets (set approved_by for older entries)
UPDATE project.timesheets
SET approved_by = '00000000-0000-0000-0000-000000000001'::uuid,
    approved_at = NOW()
WHERE worked_on <= CURRENT_DATE - INTERVAL '3 days'
  AND approved_by IS NULL
  AND org_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Create sample tasks for projects
INSERT INTO project.tasks (
  org_id, project_id, title, description, state, priority, due_date, labels, created_by
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  task_title,
  task_description,
  task_state::project.task_state,
  task_priority::project.task_priority,
  task_due_date,
  task_labels,
  '00000000-0000-0000-0000-000000000001'::uuid
FROM project.projects p
CROSS JOIN (
  VALUES
    -- Website Redesign (PROJ-001) tasks
    ('PROJ-001', 'Design Homepage', 'Create wireframes and mockups for the homepage', 'new', 'high', CURRENT_DATE + INTERVAL '7 days', ARRAY['Design', 'UI']),
    ('PROJ-001', 'Implement Navigation', 'Code the responsive navigation menu', 'new', 'medium', CURRENT_DATE + INTERVAL '10 days', ARRAY['Frontend', 'React']),
    ('PROJ-001', 'Setup Project Structure', 'Initialize React project with routing', 'in_progress', 'high', CURRENT_DATE + INTERVAL '5 days', ARRAY['Setup']),
    -- Mobile App Development (PROJ-002) tasks
    ('PROJ-002', 'Setup React Native', 'Initialize React Native project', 'in_progress', 'high', CURRENT_DATE + INTERVAL '5 days', ARRAY['Mobile', 'Setup']),
    ('PROJ-002', 'Build Login Screen', 'Create authentication UI', 'in_progress', 'medium', CURRENT_DATE + INTERVAL '10 days', ARRAY['Mobile', 'UI']),
    ('PROJ-002', 'Implement API Integration', 'Connect app to backend APIs', 'new', 'high', CURRENT_DATE + INTERVAL '15 days', ARRAY['Mobile', 'API']),
    -- Database Migration (PROJ-003) tasks
    ('PROJ-003', 'Analyze Legacy Schema', 'Document existing database structure', 'done', 'high', CURRENT_DATE - INTERVAL '5 days', ARRAY['Database']),
    ('PROJ-003', 'Create Migration Scripts', 'Write PostgreSQL migration scripts', 'in_progress', 'high', CURRENT_DATE + INTERVAL '3 days', ARRAY['Database', 'Migration']),
    ('PROJ-003', 'Test Migration Process', 'Validate data migration accuracy', 'new', 'medium', CURRENT_DATE + INTERVAL '8 days', ARRAY['Database', 'Testing']),
    -- Security Audit (PROJ-004) tasks
    ('PROJ-004', 'Vulnerability Scan', 'Run automated security scans', 'done', 'high', CURRENT_DATE - INTERVAL '20 days', ARRAY['Security']),
    ('PROJ-004', 'Penetration Testing', 'Manual security testing', 'done', 'high', CURRENT_DATE - INTERVAL '15 days', ARRAY['Security', 'Testing']),
    -- API Integration (PROJ-005) tasks
    ('PROJ-005', 'Research Payment APIs', 'Evaluate payment gateway options', 'new', 'medium', CURRENT_DATE + INTERVAL '10 days', ARRAY['API', 'Research']),
    ('PROJ-005', 'Design API Architecture', 'Plan integration architecture', 'new', 'high', CURRENT_DATE + INTERVAL '15 days', ARRAY['API', 'Design'])
) AS task_data(project_code, task_title, task_description, task_state, task_priority, task_due_date, task_labels)
WHERE p.code = task_data.project_code
ON CONFLICT DO NOTHING;

-- Create sample expenses
INSERT INTO finance.expenses (
  org_id, project_id, user_id, category, amount, tax_amount, currency, is_billable, status, spent_on, merchant, payment_method, note
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  expense_category,
  expense_amount,
  expense_tax,
  'INR',
  expense_is_billable,
  expense_status::finance.expense_status,
  expense_date,
  expense_merchant,
  expense_payment_method::finance.payment_method,
  expense_note
FROM project.projects p
CROSS JOIN (
  VALUES
    -- Website Redesign expenses
    ('PROJ-001', 'Travel', 1500.00, 0, true, 'submitted', CURRENT_DATE - INTERVAL '10 days', 'Uber', 'other', 'Client meeting travel'),
    ('PROJ-001', 'Software', 2500.00, 450.00, true, 'approved', CURRENT_DATE - INTERVAL '8 days', 'Adobe', 'card', 'Design software license'),
    -- Mobile App Development expenses
    ('PROJ-002', 'Meals', 800.00, 0, false, 'submitted', CURRENT_DATE - INTERVAL '5 days', 'Restaurant', 'card', 'Team lunch'),
    ('PROJ-002', 'Hardware', 15000.00, 2700.00, true, 'approved', CURRENT_DATE - INTERVAL '12 days', 'Apple Store', 'card', 'Test devices'),
    -- Database Migration expenses
    ('PROJ-003', 'Training', 5000.00, 900.00, true, 'submitted', CURRENT_DATE - INTERVAL '3 days', 'Online Course', 'card', 'PostgreSQL training'),
    -- Security Audit expenses
    ('PROJ-004', 'Software', 8000.00, 1440.00, true, 'approved', CURRENT_DATE - INTERVAL '25 days', 'Security Tools', 'bank_transfer', 'Security scanning tools'),
    -- API Integration expenses
    ('PROJ-005', 'Office Supplies', 500.00, 0, false, 'submitted', CURRENT_DATE, 'Stationery Store', 'cash', 'Notebooks and pens')
) AS expense_data(project_code, expense_category, expense_amount, expense_tax, expense_is_billable, expense_status, expense_date, expense_merchant, expense_payment_method, expense_note)
WHERE p.code = expense_data.project_code
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
FROM project.projects
UNION ALL
SELECT 
  'User Rates' as entity,
  COUNT(*) as count
FROM project.user_rates
UNION ALL
SELECT 
  'Timesheets' as entity,
  COUNT(*) as count
FROM project.timesheets
UNION ALL
SELECT 
  'Tasks' as entity,
  COUNT(*) as count
FROM project.tasks
UNION ALL
SELECT 
  'Expenses' as entity,
  COUNT(*) as count
FROM finance.expenses;

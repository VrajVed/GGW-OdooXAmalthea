-- ============================================================
-- Example Projects Data for Overrun Prediction
-- ============================================================
-- This SQL file contains dummy data matching the backend schema
-- Use this to test the prediction model with realistic data
-- ============================================================
-- 
-- PREREQUISITES:
-- 1. Run database/oneflow-schema.sql first to create all tables
-- 2. This script will create minimal required data (org, users, partners, currencies)
-- ============================================================

-- Create minimal master data if it doesn't exist
-- Organization
INSERT INTO auth.orgs (id, name, slug, base_currency, default_timezone)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo-org', 'USD', 'America/New_York')
ON CONFLICT (slug) DO NOTHING;

-- Currency (if not exists)
INSERT INTO catalog.currencies (code, name, symbol)
VALUES ('USD', 'US Dollar', '$')
ON CONFLICT (code) DO NOTHING;

-- Users (for project members, timesheets, etc.)
INSERT INTO auth.users (id, org_id, email, full_name, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000010',
  (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
  'user1@demo.com',
  'Demo User 1',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user1@demo.com');

INSERT INTO auth.users (id, org_id, email, full_name, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000011',
  (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
  'user2@demo.com',
  'Demo User 2',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user2@demo.com');

INSERT INTO auth.users (id, org_id, email, full_name, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000012',
  (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
  'user3@demo.com',
  'Demo User 3',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user3@demo.com');

-- Partners (customer and vendor)
INSERT INTO catalog.partners (id, org_id, type, display_name, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000020',
  (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
  'customer',
  'Demo Customer Inc',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog.partners WHERE display_name = 'Demo Customer Inc');

INSERT INTO catalog.partners (id, org_id, type, display_name, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000021',
  (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
  'vendor',
  'Demo Vendor LLC',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM catalog.partners WHERE display_name = 'Demo Vendor LLC');

-- Example: 5 sample projects with related data
-- Project 1: Small project at risk of overrun
-- Project 2: Medium project on track
-- Project 3: Large enterprise project with issues
-- Project 4: Startup project
-- Project 5: Government project

-- ============================================================
-- PROJECTS
-- ============================================================
-- Delete existing demo projects if they exist (for re-running)
DELETE FROM project.projects WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

INSERT INTO project.projects (id, org_id, code, name, status, progress_pct, start_date, end_date, 
                              baseline_start, baseline_end, budget_amount, budget_currency, created_at)
VALUES
  -- Project 1: Small project - at risk
  ('11111111-1111-1111-1111-111111111111', 
   (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1), 
   'PROJ-001', 'Website Redesign', 'in_progress', 45.5,
   '2024-01-15', '2024-04-15', '2024-01-15', '2024-04-15',
   50000.00, 'USD', '2024-01-10 10:00:00'),
  
  -- Project 2: Medium project - on track
  ('22222222-2222-2222-2222-222222222222',
   (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   'PROJ-002', 'Mobile App Development', 'in_progress', 60.0,
   '2024-02-01', '2024-06-01', '2024-02-01', '2024-06-01',
   150000.00, 'USD', '2024-01-25 14:00:00'),
  
  -- Project 3: Large enterprise - issues
  ('33333333-3333-3333-3333-333333333333',
   (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   'PROJ-003', 'ERP System Migration', 'in_progress', 35.0,
   '2024-01-01', '2024-12-31', '2024-01-01', '2024-12-31',
   500000.00, 'USD', '2023-12-15 09:00:00'),
  
  -- Project 4: Startup project
  ('44444444-4444-4444-4444-444444444444',
   (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   'PROJ-004', 'MVP Development', 'in_progress', 75.0,
   '2024-03-01', '2024-05-01', '2024-03-01', '2024-05-01',
   30000.00, 'USD', '2024-02-20 11:00:00'),
  
  -- Project 5: Government project
  ('55555555-5555-5555-5555-555555555555',
   (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   'PROJ-005', 'Public Portal System', 'in_progress', 25.0,
   '2023-06-01', '2024-12-31', '2023-06-01', '2024-12-31',
   1000000.00, 'USD', '2023-05-15 08:00:00');

-- ============================================================
-- TASKS (for scope creep and overdue calculations)
-- ============================================================
-- Project 1 tasks (some overdue, some added after start)
INSERT INTO project.tasks (id, org_id, project_id, title, state, due_date, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1), 
   '11111111-1111-1111-1111-111111111111', 'Design Mockups', 'done', '2024-02-01', '2024-01-10'),
  ('11111112-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', 'Frontend Development', 'in_progress', '2024-03-15', '2024-01-15'),
  ('11111113-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', 'Backend API', 'in_progress', '2024-03-01', '2024-01-20'), -- Overdue
  ('11111114-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', 'Testing', 'new', '2024-04-01', '2024-02-15'), -- Added after start
  ('11111115-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', 'Deployment', 'new', '2024-04-10', '2024-02-20'); -- Added after start

-- Project 2 tasks (on track)
INSERT INTO project.tasks (id, org_id, project_id, title, state, due_date, created_at)
VALUES
  ('22222221-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', 'UI Design', 'done', '2024-02-15', '2024-01-25'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', 'iOS Development', 'in_progress', '2024-04-15', '2024-02-01'),
  ('22222223-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', 'Android Development', 'in_progress', '2024-04-20', '2024-02-01'),
  ('22222224-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', 'Backend Integration', 'in_progress', '2024-05-01', '2024-02-01');

-- Project 3 tasks (many overdue)
INSERT INTO project.tasks (id, org_id, project_id, title, state, due_date, created_at)
VALUES
  ('33333331-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', 'Data Migration Plan', 'in_progress', '2024-02-01', '2023-12-15'), -- Overdue
  ('33333332-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', 'System Configuration', 'in_progress', '2024-03-01', '2024-01-01'), -- Overdue
  ('33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', 'User Training', 'new', '2024-11-01', '2024-03-15'), -- Added after start
  ('33333334-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', 'Custom Reports', 'new', '2024-10-01', '2024-02-20'); -- Added after start

-- ============================================================
-- TASK BLOCKERS (for blocker density)
-- ============================================================
INSERT INTO project.task_blockers (id, org_id, task_id, reason, created_by, resolved_at)
VALUES
  -- Project 1: 2 active blockers
  ('bbbbbb11-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111113-1111-1111-1111-111111111111', 'API documentation incomplete', 
   (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1), NULL),
  ('bbbbbb12-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111112-1111-1111-1111-111111111111', 'Design approval pending',
   (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1), NULL),
  
  -- Project 3: 1 active blocker
  ('bbbbbb31-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333331-3333-3333-3333-333333333333', 'Legacy system access issues',
   (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1), NULL);

-- ============================================================
-- TIMESHEETS (for actual cost calculation)
-- ============================================================
-- Project 1: High hours, high rates (over budget risk)
INSERT INTO project.timesheets (id, org_id, project_id, user_id, worked_on, hours, cost_rate, created_at)
VALUES
  ('aaaaaaaa-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   '2024-01-20', 8.0, 150.00, '2024-01-20 18:00:00'),
  ('aaaaaaaa-1112-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   '2024-01-25', 7.5, 150.00, '2024-01-25 17:30:00'),
  ('aaaaaaaa-1113-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   '2024-02-05', 9.0, 150.00, '2024-02-05 19:00:00'),
  ('aaaaaaaa-1114-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   '2024-02-10', 8.5, 150.00, '2024-02-10 18:30:00'),
  ('aaaaaaaa-1115-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   '2024-02-15', 6.0, 150.00, '2024-02-15 16:00:00');

-- Project 2: Moderate hours (on track)
INSERT INTO project.timesheets (id, org_id, project_id, user_id, worked_on, hours, cost_rate, created_at)
VALUES
  ('bbbbbbbb-2221-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users WHERE email = 'user2@demo.com' LIMIT 1),
   '2024-02-05', 6.0, 120.00, '2024-02-05 17:00:00'),
  ('bbbbbbbb-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users WHERE email = 'user2@demo.com' LIMIT 1),
   '2024-02-12', 7.0, 120.00, '2024-02-12 17:30:00'),
  ('bbbbbbbb-2223-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users WHERE email = 'user2@demo.com' LIMIT 1),
   '2024-02-19', 6.5, 120.00, '2024-02-19 17:15:00');

-- Project 3: Many hours (over budget)
INSERT INTO project.timesheets (id, org_id, project_id, user_id, worked_on, hours, cost_rate, created_at)
VALUES
  ('cccccccc-3331-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   '2024-01-10', 8.0, 200.00, '2024-01-10 18:00:00'),
  ('cccccccc-3332-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   '2024-01-15', 9.0, 200.00, '2024-01-15 19:00:00'),
  ('cccccccc-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   '2024-01-20', 10.0, 200.00, '2024-01-20 20:00:00'),
  ('cccccccc-3334-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   '2024-02-01', 8.5, 200.00, '2024-02-01 18:30:00'),
  ('cccccccc-3335-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   '2024-02-10', 7.0, 200.00, '2024-02-10 17:00:00');

-- ============================================================
-- EXPENSES (for actual cost)
-- ============================================================
-- Delete existing demo expenses if they exist
DELETE FROM finance.expenses WHERE id IN (
  'e1111111-1111-1111-1111-111111111111',
  'e1111112-1111-1111-1111-111111111111',
  'e2222221-2222-2222-2222-222222222222',
  'e3333331-3333-3333-3333-333333333333',
  'e3333332-3333-3333-3333-333333333333'
);

INSERT INTO finance.expenses (id, org_id, project_id, user_id, category, amount, currency, 
                              status, spent_on, created_at)
VALUES
  -- Project 1 expenses
  ('e1111111-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   'Software License', 5000.00, 'USD', 'approved', '2024-01-25', '2024-01-25 10:00:00'),
  ('e1111112-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1),
   'Hosting', 2000.00, 'USD', 'approved', '2024-02-10', '2024-02-10 11:00:00'),
  
  -- Project 2 expenses
  ('e2222221-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users WHERE email = 'user2@demo.com' LIMIT 1),
   'App Store Fees', 1000.00, 'USD', 'approved', '2024-02-15', '2024-02-15 09:00:00'),
  
  -- Project 3 expenses (high)
  ('e3333331-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   'Infrastructure', 50000.00, 'USD', 'approved', '2024-01-20', '2024-01-20 14:00:00'),
  ('e3333332-3333-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1),
   'Consulting', 30000.00, 'USD', 'approved', '2024-02-05', '2024-02-05 15:00:00');

-- ============================================================
-- PURCHASE ORDERS (for finance gaps)
-- ============================================================
DELETE FROM finance.purchase_orders WHERE id = 'dddddddd-3331-3333-3333-333333333333';

INSERT INTO finance.purchase_orders (id, org_id, project_id, vendor_partner_id, order_date,
                                     grand_total, currency, status, created_at)
VALUES
  -- Project 3: PO committed but no bill yet (finance gap)
  ('dddddddd-3331-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', (SELECT id FROM catalog.partners WHERE type='vendor' AND display_name = 'Demo Vendor LLC' LIMIT 1),
   '2024-02-15', 75000.00, 'USD', 'confirmed', '2024-02-15 10:00:00');

-- ============================================================
-- VENDOR BILLS (for actual cost)
-- ============================================================
DELETE FROM finance.vendor_bills WHERE id = 'eeeeeeee-1111-1111-1111-111111111111';

INSERT INTO finance.vendor_bills (id, org_id, project_id, vendor_partner_id, bill_date,
                                   grand_total, currency, status, created_at)
VALUES
  -- Project 1: Some bills
  ('eeeeeeee-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM catalog.partners WHERE type='vendor' AND display_name = 'Demo Vendor LLC' LIMIT 1),
   '2024-02-01', 8000.00, 'USD', 'posted', '2024-02-01 12:00:00');

-- ============================================================
-- CUSTOMER INVOICES (for invoice lag)
-- ============================================================
DELETE FROM finance.customer_invoices WHERE id IN (
  'ffffffff-1111-1111-1111-111111111111',
  'ffffffff-2222-2222-2222-222222222222'
);

INSERT INTO finance.customer_invoices (id, org_id, project_id, customer_partner_id, invoice_date,
                                       grand_total, currency, status, paid_at, created_at)
VALUES
  -- Project 1: Invoice with payment lag
  ('ffffffff-1111-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '11111111-1111-1111-1111-111111111111', (SELECT id FROM catalog.partners WHERE type='customer' AND display_name = 'Demo Customer Inc' LIMIT 1),
   '2024-02-01', 25000.00, 'USD', 'paid', '2024-03-15', '2024-02-01 10:00:00'), -- 43 days lag
   
  -- Project 2: Invoice paid quickly
  ('ffffffff-2222-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   '22222222-2222-2222-2222-222222222222', (SELECT id FROM catalog.partners WHERE type='customer' AND display_name = 'Demo Customer Inc' LIMIT 1),
   '2024-02-20', 50000.00, 'USD', 'paid', '2024-02-28', '2024-02-20 11:00:00'); -- 8 days lag

-- ============================================================
-- USER RATES (for team mix)
-- ============================================================
DELETE FROM project.user_rates WHERE id IN (
  '11111111-aaaa-1111-1111-111111111111',
  '22222222-bbbb-2222-2222-222222222222',
  '33333333-cccc-3333-3333-333333333333'
);

INSERT INTO project.user_rates (id, org_id, user_id, bill_rate, cost_rate, currency, valid_from)
VALUES
  ('11111111-aaaa-1111-1111-111111111111', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'user1@demo.com' LIMIT 1), 150.00, 100.00, 'USD', '2024-01-01'),
  ('22222222-bbbb-2222-2222-222222222222', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'user2@demo.com' LIMIT 1), 120.00, 80.00, 'USD', '2024-01-01'),
  ('33333333-cccc-3333-3333-333333333333', (SELECT id FROM auth.orgs WHERE slug = 'demo-org' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'user3@demo.com' LIMIT 1), 200.00, 140.00, 'USD', '2024-01-01');

-- ============================================================
-- NOTES
-- ============================================================
-- This SQL file creates sample data for 5 projects
-- To use this:
-- 1. Make sure you have at least one org, user, and partner in your database
-- 2. Run this SQL file against your database
-- 3. Use the predict_overrun.py script to generate predictions
-- 
-- The data is designed to show different scenarios:
-- - Project 1: At risk (high costs, overdue tasks, blockers)
-- - Project 2: On track (moderate costs, tasks on schedule)
-- - Project 3: High risk (very high costs, many overdue tasks, finance gaps)
-- - Project 4: Startup (low budget, fast progress)
-- - Project 5: Government (large budget, slow progress)


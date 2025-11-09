-- ============================================================================
-- Seed Data for Finance Modules (Sales Orders, Purchase Orders, Invoices, Bills)
-- ============================================================================
-- This file creates comprehensive seed data for all finance modules
-- linked to existing projects
-- ============================================================================

-- Organization ID (same as in seed-data.sql)
-- Using direct UUID value throughout the file

-- ============================================================================
-- 1. CATALOG DATA (Partners, Products, Payment Terms, UOMs)
-- ============================================================================

-- Insert Currencies (if not already present)
INSERT INTO catalog.currencies (code, name, symbol)
VALUES 
  ('INR', 'Indian Rupee', '₹'),
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€')
ON CONFLICT (code) DO NOTHING;

-- Insert UOMs (Units of Measure)
INSERT INTO catalog.uoms (code, name, precision)
VALUES 
  ('HOUR', 'Hour', 2),
  ('DAY', 'Day', 2),
  ('UNIT', 'Unit', 0),
  ('KG', 'Kilogram', 2),
  ('M', 'Meter', 2)
ON CONFLICT (code) DO NOTHING;

-- Insert Payment Terms
INSERT INTO catalog.payment_terms (org_id, name, days, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Net 15', 15, 'Payment due within 15 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Net 30', 30, 'Payment due within 30 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Net 45', 45, 'Payment due within 45 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Net 60', 60, 'Payment due within 60 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Due on Receipt', 0, 'Payment due immediately'),
  ('00000000-0000-0000-0000-000000000001'::uuid, '2/10 Net 30', 30, '2% discount if paid within 10 days, otherwise net 30')
ON CONFLICT (org_id, name) DO NOTHING;

-- Insert Customer Partners
INSERT INTO catalog.partners (
  org_id, type, display_name, email, phone, gst_vat_id,
  billing_address_json, shipping_address_json, currency, is_active
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'customer', 'TechCorp Solutions', 'contact@techcorp.com', '+91-9876543210', '29ABCDE1234F1Z5',
    '{"street": "123 Business Park", "city": "Mumbai", "state": "Maharashtra", "zip": "400001", "country": "India"}'::jsonb,
    '{"street": "123 Business Park", "city": "Mumbai", "state": "Maharashtra", "zip": "400001", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'customer', 'Global Enterprises Ltd', 'info@globalent.com', '+91-9876543211', '30ABCDE1234F1Z6',
    '{"street": "456 Corporate Tower", "city": "Delhi", "state": "Delhi", "zip": "110001", "country": "India"}'::jsonb,
    '{"street": "456 Corporate Tower", "city": "Delhi", "state": "Delhi", "zip": "110001", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'customer', 'Digital Innovations Inc', 'sales@digitalinnov.com', '+91-9876543212', '27ABCDE1234F1Z7',
    '{"street": "789 Tech Hub", "city": "Bangalore", "state": "Karnataka", "zip": "560001", "country": "India"}'::jsonb,
    '{"street": "789 Tech Hub", "city": "Bangalore", "state": "Karnataka", "zip": "560001", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'customer', 'Startup Ventures', 'hello@startupventures.com', '+91-9876543213', '24ABCDE1234F1Z8',
    '{"street": "321 Innovation Center", "city": "Pune", "state": "Maharashtra", "zip": "411001", "country": "India"}'::jsonb,
    '{"street": "321 Innovation Center", "city": "Pune", "state": "Maharashtra", "zip": "411001", "country": "India"}'::jsonb,
    'INR', true
  )
ON CONFLICT (org_id, display_name) DO NOTHING;

-- Insert Vendor Partners
INSERT INTO catalog.partners (
  org_id, type, display_name, email, phone, gst_vat_id,
  billing_address_json, shipping_address_json, currency, is_active
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'vendor', 'Cloud Services Provider', 'sales@cloudservices.com', '+91-9876543220', '29VENDOR1234F1Z5',
    '{"street": "100 Cloud Street", "city": "Mumbai", "state": "Maharashtra", "zip": "400002", "country": "India"}'::jsonb,
    '{"street": "100 Cloud Street", "city": "Mumbai", "state": "Maharashtra", "zip": "400002", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'vendor', 'Hardware Suppliers Co', 'orders@hardwaresuppliers.com', '+91-9876543221', '30VENDOR1234F1Z6',
    '{"street": "200 Hardware Lane", "city": "Delhi", "state": "Delhi", "zip": "110002", "country": "India"}'::jsonb,
    '{"street": "200 Hardware Lane", "city": "Delhi", "state": "Delhi", "zip": "110002", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'vendor', 'Software Licensing Corp', 'licensing@softlic.com', '+91-9876543222', '27VENDOR1234F1Z7',
    '{"street": "300 Software Avenue", "city": "Bangalore", "state": "Karnataka", "zip": "560002", "country": "India"}'::jsonb,
    '{"street": "300 Software Avenue", "city": "Bangalore", "state": "Karnataka", "zip": "560002", "country": "India"}'::jsonb,
    'INR', true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'vendor', 'Consulting Services Ltd', 'info@consultingservices.com', '+91-9876543223', '24VENDOR1234F1Z8',
    '{"street": "400 Consulting Plaza", "city": "Pune", "state": "Maharashtra", "zip": "411002", "country": "India"}'::jsonb,
    '{"street": "400 Consulting Plaza", "city": "Pune", "state": "Maharashtra", "zip": "411002", "country": "India"}'::jsonb,
    'INR', true
  )
ON CONFLICT (org_id, display_name) DO NOTHING;

-- Insert Products
INSERT INTO catalog.products (
  org_id, product_code, name, product_type, uom_id, base_price, cost_price, currency, is_active
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  product_code_val,
  product_name_val,
  product_type_val::catalog.product_type,
  (SELECT id FROM catalog.uoms WHERE code = uom_code_val LIMIT 1),
  base_price_val,
  cost_price_val,
  'INR',
  true
FROM (
  VALUES
    -- Services
    ('SRV-001', 'Web Development Service', 'service', 'HOUR', 2500.00, 1500.00),
    ('SRV-002', 'Mobile App Development', 'service', 'HOUR', 3000.00, 1800.00),
    ('SRV-003', 'Database Migration Service', 'service', 'HOUR', 2000.00, 1200.00),
    ('SRV-004', 'Security Audit Service', 'service', 'HOUR', 3500.00, 2000.00),
    ('SRV-005', 'API Integration Service', 'service', 'HOUR', 2200.00, 1300.00),
    ('SRV-006', 'UI/UX Design Service', 'service', 'HOUR', 2800.00, 1600.00),
    ('SRV-007', 'Consulting Service', 'service', 'HOUR', 4000.00, 2500.00),
    -- Goods
    ('PRD-001', 'Web Hosting Package', 'goods', 'UNIT', 5000.00, 3000.00),
    ('PRD-002', 'SSL Certificate', 'goods', 'UNIT', 2000.00, 1200.00),
    ('PRD-003', 'Domain Registration', 'goods', 'UNIT', 1000.00, 600.00),
    ('PRD-004', 'Development Server', 'goods', 'UNIT', 25000.00, 15000.00),
    -- Expenses
    ('EXP-001', 'Cloud Storage Subscription', 'expense', 'UNIT', 3000.00, 3000.00),
    ('EXP-002', 'Software License', 'expense', 'UNIT', 15000.00, 15000.00),
    ('EXP-003', 'Training Material', 'expense', 'UNIT', 5000.00, 5000.00)
) AS product_data(product_code_val, product_name_val, product_type_val, uom_code_val, base_price_val, cost_price_val)
ON CONFLICT (org_id, name) DO NOTHING;

-- Insert Sequences for document numbering
INSERT INTO finance.sequences (org_id, doc_type, prefix, next_val, padding)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'sales_order', 'SO', 1001, 6),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'purchase_order', 'PO', 1001, 6),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'customer_invoice', 'INV', 1001, 6),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'vendor_bill', 'BILL', 1001, 6)
ON CONFLICT (org_id, doc_type) DO NOTHING;

-- ============================================================================
-- 2. SALES ORDERS (with lines linked to projects)
-- ============================================================================

-- Sales Order 1: Website Redesign Project (PROJ-001)
INSERT INTO finance.sales_orders (
  org_id, number, project_id, customer_partner_id, order_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SO-0001001',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'TechCorp Solutions' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '25 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '25 days' + INTERVAL '30 days',
  'INR',
  200000.00,  -- subtotal
  10000.00,   -- discount
  34200.00,   -- tax (18% GST)
  224200.00,  -- grand_total
  'confirmed'::finance.order_status,
  'Sales order for complete website redesign project including UI/UX design and development'
FROM project.projects p
WHERE p.code = 'PROJ-001'
LIMIT 1;

-- Sales Order 1 Lines
INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Web Development Service - Homepage and Core Pages',
  50.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2500.00,
  5.00,
  6250.00,
  7875.00,  -- 18% GST on (2500 * 50 * 0.95)
  118750.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001001' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-006' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'UI/UX Design Service - Complete Design System',
  30.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2800.00,
  5.00,
  4200.00,
  7182.00,  -- 18% GST
  79800.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001001' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'PRD-001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Web Hosting Package - 1 Year',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  5000.00,
  0.00,
  0.00,
  900.00,  -- 18% GST
  5900.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001001' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Sales Order 2: Mobile App Development Project (PROJ-002)
INSERT INTO finance.sales_orders (
  org_id, number, project_id, customer_partner_id, order_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SO-0001002',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Global Enterprises Ltd' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '20 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 45' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '20 days' + INTERVAL '45 days',
  'INR',
  450000.00,
  22500.00,
  76950.00,
  503450.00,
  'confirmed'::finance.order_status,
  'Sales order for cross-platform mobile application development'
FROM project.projects p
WHERE p.code = 'PROJ-002'
LIMIT 1;

-- Sales Order 2 Lines
INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Mobile App Development - React Native Development',
  120.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  3000.00,
  5.00,
  18000.00,
  61020.00,
  342000.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001002' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-005' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'API Integration Service - Backend API Integration',
  40.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2200.00,
  5.00,
  4400.00,
  7524.00,
  83600.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001002' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'PRD-004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Development Server - Cloud Infrastructure',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  25000.00,
  0.00,
  0.00,
  4500.00,
  29500.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001002' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Sales Order 3: Database Migration Project (PROJ-003)
INSERT INTO finance.sales_orders (
  org_id, number, project_id, customer_partner_id, order_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SO-0001003',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Digital Innovations Inc' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '15 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '15 days' + INTERVAL '30 days',
  'INR',
  150000.00,
  7500.00,
  25650.00,
  168150.00,
  'fulfilled'::finance.order_status,
  'Sales order for database migration from legacy system to PostgreSQL'
FROM project.projects p
WHERE p.code = 'PROJ-003'
LIMIT 1;

-- Sales Order 3 Lines
INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-003' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Database Migration Service - Complete Migration',
  60.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2000.00,
  5.00,
  6000.00,
  34560.00,
  192000.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001003' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Sales Order 4: Security Audit Project (PROJ-004) - Completed
INSERT INTO finance.sales_orders (
  org_id, number, project_id, customer_partner_id, order_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SO-0001004',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Startup Ventures' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '50 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '50 days' + INTERVAL '30 days',
  'INR',
  280000.00,
  14000.00,
  47880.00,
  313880.00,
  'closed'::finance.order_status,
  'Sales order for comprehensive security audit and penetration testing',
  CURRENT_DATE - INTERVAL '45 days'
FROM project.projects p
WHERE p.code = 'PROJ-004'
LIMIT 1;

-- Sales Order 4 Lines
INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Security Audit Service - Complete Security Assessment',
  70.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  3500.00,
  5.00,
  12250.00,
  60795.00,
  338250.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001004' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Sales Order 5: API Integration Project (PROJ-005) - Draft
INSERT INTO finance.sales_orders (
  org_id, number, project_id, customer_partner_id, order_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SO-0001005',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'TechCorp Solutions' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '5 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 15' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '5 days' + INTERVAL '15 days',
  'INR',
  88000.00,
  4400.00,
  15048.00,
  98648.00,
  'draft'::finance.order_status,
  'Sales order for third-party payment gateway API integration'
FROM project.projects p
WHERE p.code = 'PROJ-005'
LIMIT 1;

-- Sales Order 5 Lines
INSERT INTO finance.sales_order_lines (
  org_id, sales_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  so.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-005' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'API Integration Service - Payment Gateway Integration',
  40.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2200.00,
  5.00,
  4400.00,
  15048.00,
  83600.00
FROM finance.sales_orders so
WHERE so.number = 'SO-0001005' AND so.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- ============================================================================
-- 3. PURCHASE ORDERS (with lines linked to projects)
-- ============================================================================

-- Purchase Order 1: Website Redesign Project - Software Licenses
INSERT INTO finance.purchase_orders (
  org_id, number, project_id, vendor_partner_id, order_date, expected_delivery_date,
  payment_terms_id, due_date, currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PO-0001001',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Software Licensing Corp' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '22 days',
  CURRENT_DATE - INTERVAL '15 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '22 days' + INTERVAL '30 days',
  'INR',
  15000.00,
  0.00,
  2700.00,
  17700.00,
  'confirmed'::finance.order_status,
  'Purchase order for design software licenses for website redesign project'
FROM project.projects p
WHERE p.code = 'PROJ-001'
LIMIT 1;

-- Purchase Order 1 Lines
INSERT INTO finance.purchase_order_lines (
  org_id, purchase_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  po.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Software License - Adobe Creative Suite',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  15000.00,
  0.00,
  0.00,
  2700.00,
  17700.00
FROM finance.purchase_orders po
WHERE po.number = 'PO-0001001' AND po.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Purchase Order 2: Mobile App Development - Hardware
INSERT INTO finance.purchase_orders (
  org_id, number, project_id, vendor_partner_id, order_date, expected_delivery_date,
  payment_terms_id, due_date, currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PO-0001002',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Hardware Suppliers Co' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '18 days',
  CURRENT_DATE - INTERVAL '10 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 45' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '18 days' + INTERVAL '45 days',
  'INR',
  25000.00,
  2500.00,
  4050.00,
  26550.00,
  'fulfilled'::finance.order_status,
  'Purchase order for test devices and hardware for mobile app development'
FROM project.projects p
WHERE p.code = 'PROJ-002'
LIMIT 1;

-- Purchase Order 2 Lines
INSERT INTO finance.purchase_order_lines (
  org_id, purchase_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  po.id,
  (SELECT id FROM catalog.products WHERE product_code = 'PRD-004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Development Server - Test Devices',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  25000.00,
  10.00,
  2500.00,
  4050.00,
  26550.00
FROM finance.purchase_orders po
WHERE po.number = 'PO-0001002' AND po.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Purchase Order 3: Database Migration - Cloud Services
INSERT INTO finance.purchase_orders (
  org_id, number, project_id, vendor_partner_id, order_date, expected_delivery_date,
  payment_terms_id, due_date, currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PO-0001003',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Cloud Services Provider' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '12 days',
  CURRENT_DATE - INTERVAL '5 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '12 days' + INTERVAL '30 days',
  'INR',
  3000.00,
  0.00,
  540.00,
  3540.00,
  'confirmed'::finance.order_status,
  'Purchase order for cloud storage subscription for database migration project'
FROM project.projects p
WHERE p.code = 'PROJ-003'
LIMIT 1;

-- Purchase Order 3 Lines
INSERT INTO finance.purchase_order_lines (
  org_id, purchase_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  po.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Cloud Storage Subscription - 1 Year',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  3000.00,
  0.00,
  0.00,
  540.00,
  3540.00
FROM finance.purchase_orders po
WHERE po.number = 'PO-0001003' AND po.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Purchase Order 4: Security Audit - Security Tools
INSERT INTO finance.purchase_orders (
  org_id, number, project_id, vendor_partner_id, order_date, expected_delivery_date,
  payment_terms_id, due_date, currency, subtotal, discount_total, tax_total, grand_total, status, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PO-0001004',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Software Licensing Corp' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '40 days',
  CURRENT_DATE - INTERVAL '35 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '40 days' + INTERVAL '30 days',
  'INR',
  8000.00,
  0.00,
  1440.00,
  9440.00,
  'closed'::finance.order_status,
  'Purchase order for security scanning tools for security audit project',
  CURRENT_DATE - INTERVAL '35 days'
FROM project.projects p
WHERE p.code = 'PROJ-004'
LIMIT 1;

-- Purchase Order 4 Lines
INSERT INTO finance.purchase_order_lines (
  org_id, purchase_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  po.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Software License - Security Scanning Tools',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  8000.00,
  0.00,
  0.00,
  1440.00,
  9440.00
FROM finance.purchase_orders po
WHERE po.number = 'PO-0001004' AND po.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Purchase Order 5: API Integration - Consulting Services
INSERT INTO finance.purchase_orders (
  org_id, number, project_id, vendor_partner_id, order_date, expected_delivery_date,
  payment_terms_id, due_date, currency, subtotal, discount_total, tax_total, grand_total, status, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PO-0001005',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Consulting Services Ltd' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '7 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 15' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '3 days' + INTERVAL '15 days',
  'INR',
  40000.00,
  2000.00,
  6840.00,
  44840.00,
  'draft'::finance.order_status,
  'Purchase order for payment gateway integration consulting services'
FROM project.projects p
WHERE p.code = 'PROJ-005'
LIMIT 1;

-- Purchase Order 5 Lines
INSERT INTO finance.purchase_order_lines (
  org_id, purchase_order_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  po.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-007' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Consulting Service - Payment Gateway Integration',
  10.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  4000.00,
  5.00,
  2000.00,
  6840.00,
  44840.00
FROM finance.purchase_orders po
WHERE po.number = 'PO-0001005' AND po.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- ============================================================================
-- 4. CUSTOMER INVOICES (with lines linked to projects and sales orders)
-- ============================================================================

-- Invoice 1: Website Redesign Project - From Sales Order SO-0001001
INSERT INTO finance.customer_invoices (
  org_id, number, project_id, customer_partner_id, invoice_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, originated_from, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-0001001',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'TechCorp Solutions' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '20 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '20 days' + INTERVAL '30 days',
  'INR',
  200000.00,
  10000.00,
  34200.00,
  224200.00,
  'posted'::finance.invoice_status,
  'manual'::finance.source_type,
  'Invoice for website redesign project - Phase 1 completed',
  CURRENT_DATE - INTERVAL '20 days'
FROM project.projects p
WHERE p.code = 'PROJ-001'
LIMIT 1;

-- Invoice 1 Lines
INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id, sales_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Web Development Service - Homepage and Core Pages',
  50.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2500.00,
  5.00,
  6250.00,
  7875.00,
  118750.00,
  'manual'::finance.source_type,
  inv.project_id,
  (SELECT sol.id FROM finance.sales_order_lines sol 
   JOIN finance.sales_orders so ON sol.sales_order_id = so.id 
   WHERE so.number = 'SO-0001001' AND sol.org_id = '00000000-0000-0000-0000-000000000001'::uuid 
   ORDER BY sol.id LIMIT 1)
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001001' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id, sales_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-006' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'UI/UX Design Service - Complete Design System',
  30.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2800.00,
  5.00,
  4200.00,
  7182.00,
  79800.00,
  'manual'::finance.source_type,
  inv.project_id,
  (SELECT sol.id FROM finance.sales_order_lines sol 
   JOIN finance.sales_orders so ON sol.sales_order_id = so.id 
   WHERE so.number = 'SO-0001001' AND sol.org_id = '00000000-0000-0000-0000-000000000001'::uuid 
   ORDER BY sol.id OFFSET 1 LIMIT 1)
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001001' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Invoice 2: Mobile App Development Project - Partial Invoice
INSERT INTO finance.customer_invoices (
  org_id, number, project_id, customer_partner_id, invoice_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, originated_from, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-0001002',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Global Enterprises Ltd' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '15 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 45' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '15 days' + INTERVAL '45 days',
  'INR',
  300000.00,
  15000.00,
  51300.00,
  336300.00,
  'partially_paid'::finance.invoice_status,
  'manual'::finance.source_type,
  'Invoice for mobile app development project - Phase 1 (60% of total)',
  CURRENT_DATE - INTERVAL '15 days'
FROM project.projects p
WHERE p.code = 'PROJ-002'
LIMIT 1;

-- Invoice 2 Lines
INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Mobile App Development - React Native Development (Phase 1)',
  80.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  3000.00,
  5.00,
  12000.00,
  41040.00,
  228000.00,
  'manual'::finance.source_type,
  inv.project_id
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001002' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Invoice 3: Database Migration Project - Paid Invoice
INSERT INTO finance.customer_invoices (
  org_id, number, project_id, customer_partner_id, invoice_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, originated_from, notes, posted_at, paid_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-0001003',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Digital Innovations Inc' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '10 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days',
  'INR',
  150000.00,
  7500.00,
  25650.00,
  168150.00,
  'paid'::finance.invoice_status,
  'manual'::finance.source_type,
  'Invoice for database migration project - Completed and paid',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE - INTERVAL '5 days'
FROM project.projects p
WHERE p.code = 'PROJ-003'
LIMIT 1;

-- Invoice 3 Lines
INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-003' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Database Migration Service - Complete Migration',
  60.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2000.00,
  5.00,
  6000.00,
  25920.00,
  144000.00,
  'manual'::finance.source_type,
  inv.project_id
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001003' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Invoice 4: Security Audit Project - Paid Invoice
INSERT INTO finance.customer_invoices (
  org_id, number, project_id, customer_partner_id, invoice_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, originated_from, notes, posted_at, paid_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-0001004',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Startup Ventures' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '40 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '40 days' + INTERVAL '30 days',
  'INR',
  280000.00,
  14000.00,
  47880.00,
  313880.00,
  'paid'::finance.invoice_status,
  'manual'::finance.source_type,
  'Invoice for security audit project - Completed and paid in full',
  CURRENT_DATE - INTERVAL '40 days',
  CURRENT_DATE - INTERVAL '35 days'
FROM project.projects p
WHERE p.code = 'PROJ-004'
LIMIT 1;

-- Invoice 4 Lines
INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Security Audit Service - Complete Security Assessment',
  70.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  3500.00,
  5.00,
  12250.00,
  48195.00,
  267750.00,
  'manual'::finance.source_type,
  inv.project_id
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001004' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Invoice 5: API Integration Project - Draft Invoice
INSERT INTO finance.customer_invoices (
  org_id, number, project_id, customer_partner_id, invoice_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, originated_from, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'INV-0001005',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'TechCorp Solutions' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 15' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '2 days' + INTERVAL '15 days',
  'INR',
  88000.00,
  4400.00,
  15048.00,
  98648.00,
  'draft'::finance.invoice_status,
  'manual'::finance.source_type,
  'Draft invoice for API integration project - Pending approval'
FROM project.projects p
WHERE p.code = 'PROJ-005'
LIMIT 1;

-- Invoice 5 Lines
INSERT INTO finance.invoice_lines (
  org_id, invoice_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, source_type, project_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  inv.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-005' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'API Integration Service - Payment Gateway Integration',
  40.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  2200.00,
  5.00,
  4400.00,
  15048.00,
  83600.00,
  'manual'::finance.source_type,
  inv.project_id
FROM finance.customer_invoices inv
WHERE inv.number = 'INV-0001005' AND inv.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- ============================================================================
-- 5. VENDOR BILLS (with lines linked to projects and purchase orders)
-- ============================================================================

-- Vendor Bill 1: Website Redesign - Software Licenses (from PO-0001001)
INSERT INTO finance.vendor_bills (
  org_id, number, project_id, vendor_partner_id, bill_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, purchase_order_id, originated_from, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BILL-0001001',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Software Licensing Corp' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '18 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '18 days' + INTERVAL '30 days',
  'INR',
  15000.00,
  0.00,
  2700.00,
  17700.00,
  'posted'::finance.invoice_status,
  (SELECT id FROM finance.purchase_orders WHERE number = 'PO-0001001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'manual'::finance.source_type,
  'Vendor bill for software licenses - Website redesign project',
  CURRENT_DATE - INTERVAL '18 days'
FROM project.projects p
WHERE p.code = 'PROJ-001'
LIMIT 1;

-- Vendor Bill 1 Lines
INSERT INTO finance.bill_lines (
  org_id, bill_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, purchase_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  vb.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Software License - Adobe Creative Suite',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  15000.00,
  0.00,
  0.00,
  2700.00,
  17700.00,
  (SELECT pol.id FROM finance.purchase_order_lines pol 
   JOIN finance.purchase_orders po ON pol.purchase_order_id = po.id 
   WHERE po.number = 'PO-0001001' AND pol.org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1)
FROM finance.vendor_bills vb
WHERE vb.number = 'BILL-0001001' AND vb.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Vendor Bill 2: Mobile App Development - Hardware (from PO-0001002)
INSERT INTO finance.vendor_bills (
  org_id, number, project_id, vendor_partner_id, bill_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, purchase_order_id, originated_from, notes, posted_at, paid_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BILL-0001002',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Hardware Suppliers Co' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '12 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 45' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '12 days' + INTERVAL '45 days',
  'INR',
  25000.00,
  2500.00,
  4050.00,
  26550.00,
  'paid'::finance.invoice_status,
  (SELECT id FROM finance.purchase_orders WHERE number = 'PO-0001002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'manual'::finance.source_type,
  'Vendor bill for test devices - Mobile app development project',
  CURRENT_DATE - INTERVAL '12 days',
  CURRENT_DATE - INTERVAL '5 days'
FROM project.projects p
WHERE p.code = 'PROJ-002'
LIMIT 1;

-- Vendor Bill 2 Lines
INSERT INTO finance.bill_lines (
  org_id, bill_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, purchase_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  vb.id,
  (SELECT id FROM catalog.products WHERE product_code = 'PRD-004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Development Server - Test Devices',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  25000.00,
  10.00,
  2500.00,
  4050.00,
  26550.00,
  (SELECT pol.id FROM finance.purchase_order_lines pol 
   JOIN finance.purchase_orders po ON pol.purchase_order_id = po.id 
   WHERE po.number = 'PO-0001002' AND pol.org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1)
FROM finance.vendor_bills vb
WHERE vb.number = 'BILL-0001002' AND vb.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Vendor Bill 3: Database Migration - Cloud Services (from PO-0001003)
INSERT INTO finance.vendor_bills (
  org_id, number, project_id, vendor_partner_id, bill_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, purchase_order_id, originated_from, notes, posted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BILL-0001003',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Cloud Services Provider' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '8 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '8 days' + INTERVAL '30 days',
  'INR',
  3000.00,
  0.00,
  540.00,
  3540.00,
  'posted'::finance.invoice_status,
  (SELECT id FROM finance.purchase_orders WHERE number = 'PO-0001003' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'manual'::finance.source_type,
  'Vendor bill for cloud storage subscription - Database migration project',
  CURRENT_DATE - INTERVAL '8 days'
FROM project.projects p
WHERE p.code = 'PROJ-003'
LIMIT 1;

-- Vendor Bill 3 Lines
INSERT INTO finance.bill_lines (
  org_id, bill_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, purchase_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  vb.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-001' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Cloud Storage Subscription - 1 Year',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  3000.00,
  0.00,
  0.00,
  540.00,
  3540.00,
  (SELECT pol.id FROM finance.purchase_order_lines pol 
   JOIN finance.purchase_orders po ON pol.purchase_order_id = po.id 
   WHERE po.number = 'PO-0001003' AND pol.org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1)
FROM finance.vendor_bills vb
WHERE vb.number = 'BILL-0001003' AND vb.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Vendor Bill 4: Security Audit - Security Tools (from PO-0001004)
INSERT INTO finance.vendor_bills (
  org_id, number, project_id, vendor_partner_id, bill_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, purchase_order_id, originated_from, notes, posted_at, paid_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BILL-0001004',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Software Licensing Corp' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '35 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 30' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '35 days' + INTERVAL '30 days',
  'INR',
  8000.00,
  0.00,
  1440.00,
  9440.00,
  'paid'::finance.invoice_status,
  (SELECT id FROM finance.purchase_orders WHERE number = 'PO-0001004' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'manual'::finance.source_type,
  'Vendor bill for security scanning tools - Security audit project',
  CURRENT_DATE - INTERVAL '35 days',
  CURRENT_DATE - INTERVAL '30 days'
FROM project.projects p
WHERE p.code = 'PROJ-004'
LIMIT 1;

-- Vendor Bill 4 Lines
INSERT INTO finance.bill_lines (
  org_id, bill_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, purchase_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  vb.id,
  (SELECT id FROM catalog.products WHERE product_code = 'EXP-002' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Software License - Security Scanning Tools',
  1.00,
  (SELECT id FROM catalog.uoms WHERE code = 'UNIT' LIMIT 1),
  8000.00,
  0.00,
  0.00,
  1440.00,
  9440.00,
  (SELECT pol.id FROM finance.purchase_order_lines pol 
   JOIN finance.purchase_orders po ON pol.purchase_order_id = po.id 
   WHERE po.number = 'PO-0001004' AND pol.org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1)
FROM finance.vendor_bills vb
WHERE vb.number = 'BILL-0001004' AND vb.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- Vendor Bill 5: API Integration - Consulting Services (from PO-0001005)
INSERT INTO finance.vendor_bills (
  org_id, number, project_id, vendor_partner_id, bill_date, payment_terms_id, due_date,
  currency, subtotal, discount_total, tax_total, grand_total, status, purchase_order_id, originated_from, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BILL-0001005',
  p.id,
  (SELECT id FROM catalog.partners WHERE display_name = 'Consulting Services Ltd' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '1 days',
  (SELECT id FROM catalog.payment_terms WHERE name = 'Net 15' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  CURRENT_DATE - INTERVAL '1 days' + INTERVAL '15 days',
  'INR',
  40000.00,
  2000.00,
  6840.00,
  44840.00,
  'draft'::finance.invoice_status,
  (SELECT id FROM finance.purchase_orders WHERE number = 'PO-0001005' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'manual'::finance.source_type,
  'Draft vendor bill for consulting services - API integration project'
FROM project.projects p
WHERE p.code = 'PROJ-005'
LIMIT 1;

-- Vendor Bill 5 Lines
INSERT INTO finance.bill_lines (
  org_id, bill_id, product_id, description, quantity, uom_id, unit_price,
  discount_percent, discount_amount, tax_amount, line_total, purchase_order_line_id
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  vb.id,
  (SELECT id FROM catalog.products WHERE product_code = 'SRV-007' AND org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1),
  'Consulting Service - Payment Gateway Integration',
  10.00,
  (SELECT id FROM catalog.uoms WHERE code = 'HOUR' LIMIT 1),
  4000.00,
  5.00,
  2000.00,
  6840.00,
  44840.00,
  (SELECT pol.id FROM finance.purchase_order_lines pol 
   JOIN finance.purchase_orders po ON pol.purchase_order_id = po.id 
   WHERE po.number = 'PO-0001005' AND pol.org_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1)
FROM finance.vendor_bills vb
WHERE vb.number = 'BILL-0001005' AND vb.org_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  'Sales Orders' as entity,
  COUNT(*) as count
FROM finance.sales_orders
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Sales Order Lines' as entity,
  COUNT(*) as count
FROM finance.sales_order_lines
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Purchase Orders' as entity,
  COUNT(*) as count
FROM finance.purchase_orders
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Purchase Order Lines' as entity,
  COUNT(*) as count
FROM finance.purchase_order_lines
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Customer Invoices' as entity,
  COUNT(*) as count
FROM finance.customer_invoices
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Invoice Lines' as entity,
  COUNT(*) as count
FROM finance.invoice_lines
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Vendor Bills' as entity,
  COUNT(*) as count
FROM finance.vendor_bills
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 
  'Bill Lines' as entity,
  COUNT(*) as count
FROM finance.bill_lines
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid;


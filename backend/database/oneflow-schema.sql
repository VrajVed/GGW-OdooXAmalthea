-- =========================
-- OneFlow Schema - Comprehensive ERP System
-- =========================
-- This schema coexists with the existing simple users table
-- The existing auth.users table is kept separate for backward compatibility
-- =========================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS project;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Utility function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END $$;

-- =========================
-- AUTH SCHEMA
-- =========================
CREATE TYPE auth.role_type AS ENUM ('admin','project_manager','team_member','finance');

CREATE TABLE auth.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  base_currency CHAR(3),
  default_timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_auth_orgs_u BEFORE UPDATE ON auth.orgs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE auth.orgs IS 'Organizations for multi-tenancy support';

-- Note: We keep the existing public.users table for simple auth
-- This auth.users table is for the comprehensive multi-tenant system
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  email_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  timezone TEXT, 
  locale TEXT, 
  phone TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email)
);
CREATE INDEX ON auth.users (org_id, is_active);
CREATE TRIGGER trg_auth_users_u BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE auth.users IS 'Multi-tenant user accounts (separate from public.users for backward compatibility)';

CREATE TABLE auth.user_roles (
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role auth.role_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id, role)
);

CREATE TABLE auth.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);
CREATE TRIGGER trg_auth_teams_u BEFORE UPDATE ON auth.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE auth.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auth.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(org_id, team_id, user_id)
);

CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT,
  ip INET, 
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE auth.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- OPS SCHEMA (files, attachments, notifications, audit, webhooks)
-- =========================
CREATE TYPE ops.attach_entity AS ENUM
 ('project','task','timesheet','expense','customer_invoice','vendor_bill','sales_order','purchase_order','milestone','comment','product','partner');

CREATE TABLE ops.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  sha256 TEXT,
  storage_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thumbnails_json JSONB,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON ops.files (org_id);

CREATE TABLE ops.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  entity_type ops.attach_entity NOT NULL,
  entity_id UUID NOT NULL,
  file_id UUID NOT NULL REFERENCES ops.files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON ops.attachments (org_id, entity_type, entity_id);

CREATE TABLE ops.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON ops.notifications (org_id, user_id, is_read);

CREATE TABLE ops.audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID,
  actor_user_id UUID,
  table_fqdn TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('I','U','D')),
  row_pk JSONB,
  before_json JSONB,
  after_json JSONB,
  ip INET,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ops.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  event TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ops.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES ops.webhooks(id) ON DELETE CASCADE,
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- CATALOG SCHEMA (masters)
-- =========================
CREATE TYPE catalog.partner_type AS ENUM ('customer','vendor','both');
CREATE TYPE catalog.product_type AS ENUM ('service','goods','expense','other');

CREATE TABLE catalog.currencies (
  code CHAR(3) PRIMARY KEY,
  name TEXT,
  symbol TEXT
);

CREATE TABLE catalog.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  quote CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  rate NUMERIC(20,8) NOT NULL CHECK (rate > 0),
  valid_date DATE NOT NULL,
  UNIQUE(base, quote, valid_date)
);

CREATE TABLE catalog.uoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  precision SMALLINT NOT NULL DEFAULT 2
);

CREATE TABLE catalog.taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate NUMERIC(7,4) NOT NULL CHECK (rate >= 0),
  is_compound BOOLEAN NOT NULL DEFAULT FALSE,
  is_inclusive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE catalog.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days INT NOT NULL CHECK (days >= 0),
  description TEXT,
  UNIQUE(org_id, name)
);

CREATE TABLE catalog.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES catalog.product_categories(id) ON DELETE SET NULL,
  UNIQUE(org_id, name)
);

CREATE TABLE catalog.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  type catalog.partner_type NOT NULL,
  display_name TEXT NOT NULL,
  email CITEXT, 
  phone TEXT, 
  gst_vat_id TEXT,
  billing_address_json JSONB, 
  shipping_address_json JSONB,
  currency CHAR(3) REFERENCES catalog.currencies(code),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, display_name)
);
CREATE INDEX ON catalog.partners (org_id, type, is_active);
CREATE TRIGGER trg_catalog_partners_u BEFORE UPDATE ON catalog.partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE catalog.partner_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES catalog.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email CITEXT, 
  phone TEXT, 
  role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE catalog.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  product_code TEXT,
  name TEXT NOT NULL,
  product_type catalog.product_type NOT NULL,
  uom_id UUID REFERENCES catalog.uoms(id),
  category_id UUID REFERENCES catalog.product_categories(id),
  base_price NUMERIC(20,6) DEFAULT 0,
  cost_price NUMERIC(20,6) DEFAULT 0,
  currency CHAR(3) REFERENCES catalog.currencies(code),
  tax_ids UUID[] DEFAULT '{}',
  image_file_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);
CREATE INDEX ON catalog.products (org_id, product_type, is_active);
CREATE TRIGGER trg_catalog_products_u BEFORE UPDATE ON catalog.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add FK now that currencies exist
ALTER TABLE auth.orgs
  ADD CONSTRAINT orgs_base_currency_fk FOREIGN KEY (base_currency)
  REFERENCES catalog.currencies(code);

-- =========================
-- PROJECT SCHEMA
-- =========================
CREATE TYPE project.project_status AS ENUM ('planned','in_progress','completed','on_hold','cancelled');
CREATE TYPE project.task_state    AS ENUM ('new','in_progress','blocked','done');
CREATE TYPE project.task_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE project.billing_type  AS ENUM ('fixed','tm','retainer');
CREATE TYPE project.progress_mode AS ENUM ('auto','manual');

CREATE TABLE project.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status project.project_status NOT NULL DEFAULT 'planned',
  manager_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_partner_id UUID REFERENCES catalog.partners(id) ON DELETE SET NULL,
  billing_type project.billing_type NOT NULL DEFAULT 'tm',
  default_currency CHAR(3) REFERENCES catalog.currencies(code),
  progress_mode project.progress_mode NOT NULL DEFAULT 'auto',
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  start_date DATE, 
  end_date DATE,
  baseline_start DATE, 
  baseline_end DATE,
  budget_amount NUMERIC(20,6) DEFAULT 0,
  budget_currency CHAR(3) REFERENCES catalog.currencies(code),
  color TEXT, 
  tags TEXT[] DEFAULT '{}',
  reference_no TEXT,
  archived_at TIMESTAMPTZ,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);
CREATE INDEX ON project.projects (org_id, status);
CREATE TRIGGER trg_project_projects_u BEFORE UPDATE ON project.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE project.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role auth.role_type NOT NULL DEFAULT 'team_member',
  is_billable BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(project_id, user_id)
);

CREATE TABLE project.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(20,6) DEFAULT 0,
  sequence INT NOT NULL DEFAULT 10,
  due_date DATE,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  invoice_id UUID,
  UNIQUE(project_id, name)
);

CREATE TABLE project.task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wip_limit INT,
  sequence INT NOT NULL DEFAULT 10,
  UNIQUE(project_id, name)
);

CREATE TABLE project.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
  list_id UUID REFERENCES project.task_lists(id) ON DELETE SET NULL,
  parent_task_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  state project.task_state NOT NULL DEFAULT 'new',
  priority project.task_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  due_date DATE,
  estimate_hours NUMERIC(10,2) DEFAULT 0,
  story_points INT,
  labels TEXT[] DEFAULT '{}',
  position INT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE project.tasks
  ADD CONSTRAINT tasks_parent_fk FOREIGN KEY (parent_task_id) REFERENCES project.tasks(id) ON DELETE SET NULL;
CREATE INDEX ON project.tasks (project_id, state, priority, due_date);
CREATE INDEX project_tasks_labels_gin ON project.tasks USING GIN (labels);
CREATE TRIGGER trg_project_tasks_u BEFORE UPDATE ON project.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE project.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

CREATE TABLE project.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'finish_start',
  UNIQUE(blocking_task_id, blocked_task_id)
);

CREATE TABLE project.task_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

CREATE TABLE project.task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  position INT
);

CREATE TABLE project.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project.task_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project.tasks(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE project.user_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_rate NUMERIC(20,6) NOT NULL CHECK (bill_rate >= 0),
  cost_rate NUMERIC(20,6) NOT NULL CHECK (cost_rate >= 0),
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  valid_from DATE NOT NULL,
  valid_to DATE,
  UNIQUE(org_id, user_id, valid_from)
);

CREATE TABLE project.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project.tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worked_on DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hours NUMERIC(10,2) NOT NULL CHECK (hours > 0),
  is_billable BOOLEAN NOT NULL DEFAULT TRUE,
  bill_rate NUMERIC(20,6),
  cost_rate NUMERIC(20,6),
  source TEXT DEFAULT 'manual',
  location TEXT, 
  device_info TEXT,
  note TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  invoice_line_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON project.timesheets (org_id, project_id, user_id, worked_on);

-- =========================
-- FINANCE SCHEMA
-- =========================
CREATE TYPE finance.order_status   AS ENUM ('draft','confirmed','fulfilled','closed','cancelled');
CREATE TYPE finance.invoice_status AS ENUM ('draft','posted','partially_paid','paid','cancelled');
CREATE TYPE finance.expense_status AS ENUM ('submitted','approved','rejected','reimbursed','paid');
CREATE TYPE finance.payment_method AS ENUM ('cash','bank_transfer','card','upi','other');
CREATE TYPE finance.source_type    AS ENUM ('milestone','timesheet','expense','manual');
CREATE TYPE finance.docline_type   AS ENUM ('sales_order_line','purchase_order_line','invoice_line','bill_line');
CREATE TYPE finance.alloc_doc_type AS ENUM ('customer_invoice','vendor_bill');

CREATE TABLE finance.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  prefix TEXT NOT NULL,
  next_val BIGINT NOT NULL DEFAULT 1,
  padding SMALLINT NOT NULL DEFAULT 5,
  UNIQUE(org_id, doc_type)
);

CREATE TABLE finance.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  number TEXT UNIQUE,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  customer_partner_id UUID NOT NULL REFERENCES catalog.partners(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_terms_id UUID REFERENCES catalog.payment_terms(id),
  due_date DATE,
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  fx_rate NUMERIC(20,8),
  subtotal NUMERIC(20,6) NOT NULL DEFAULT 0,
  discount_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  grand_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  base_currency_total NUMERIC(20,6),
  status finance.order_status NOT NULL DEFAULT 'draft',
  reference TEXT,
  notes TEXT,
  bill_to_snapshot_json JSONB,
  ship_to_snapshot_json JSONB,
  posted_at TIMESTAMPTZ, 
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON finance.sales_orders (org_id, project_id, status);
CREATE TRIGGER trg_fin_so_u BEFORE UPDATE ON finance.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE finance.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES finance.sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES catalog.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  uom_id UUID REFERENCES catalog.uoms(id),
  unit_price NUMERIC(20,6) NOT NULL,
  discount_percent NUMERIC(7,4) DEFAULT 0,
  discount_amount NUMERIC(20,6) DEFAULT 0,
  tax_amount NUMERIC(20,6) DEFAULT 0,
  tax_ids UUID[] DEFAULT '{}',
  line_total NUMERIC(20,6) NOT NULL,
  milestone_id UUID REFERENCES project.milestones(id) ON DELETE SET NULL
);
CREATE INDEX ON finance.sales_order_lines (sales_order_id);

CREATE TABLE finance.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  number TEXT UNIQUE,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  vendor_partner_id UUID NOT NULL REFERENCES catalog.partners(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  payment_terms_id UUID REFERENCES catalog.payment_terms(id),
  due_date DATE,
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  fx_rate NUMERIC(20,8),
  subtotal NUMERIC(20,6) NOT NULL DEFAULT 0,
  discount_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  grand_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  base_currency_total NUMERIC(20,6),
  status finance.order_status NOT NULL DEFAULT 'draft',
  reference TEXT,
  notes TEXT,
  bill_to_snapshot_json JSONB,
  ship_to_snapshot_json JSONB,
  posted_at TIMESTAMPTZ, 
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON finance.purchase_orders (org_id, project_id, status);
CREATE TRIGGER trg_fin_po_u BEFORE UPDATE ON finance.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE finance.purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES finance.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES catalog.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  uom_id UUID REFERENCES catalog.uoms(id),
  unit_price NUMERIC(20,6) NOT NULL,
  discount_percent NUMERIC(7,4) DEFAULT 0,
  discount_amount NUMERIC(20,6) DEFAULT 0,
  tax_amount NUMERIC(20,6) DEFAULT 0,
  tax_ids UUID[] DEFAULT '{}',
  line_total NUMERIC(20,6) NOT NULL
);
CREATE INDEX ON finance.purchase_order_lines (purchase_order_id);

CREATE TABLE finance.customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  number TEXT UNIQUE,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  customer_partner_id UUID NOT NULL REFERENCES catalog.partners(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_terms_id UUID REFERENCES catalog.payment_terms(id),
  due_date DATE,
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  fx_rate NUMERIC(20,8),
  subtotal NUMERIC(20,6) NOT NULL DEFAULT 0,
  discount_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  grand_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  base_currency_total NUMERIC(20,6),
  status finance.invoice_status NOT NULL DEFAULT 'draft',
  originated_from finance.source_type DEFAULT 'manual',
  reference TEXT,
  notes TEXT,
  posted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  bill_to_snapshot_json JSONB,
  ship_to_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON finance.customer_invoices (org_id, project_id, status);
CREATE INDEX ON finance.customer_invoices (customer_partner_id, status);
CREATE TRIGGER trg_fin_ci_u BEFORE UPDATE ON finance.customer_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE finance.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES finance.customer_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES catalog.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  uom_id UUID REFERENCES catalog.uoms(id),
  unit_price NUMERIC(20,6) NOT NULL,
  discount_percent NUMERIC(7,4) DEFAULT 0,
  discount_amount NUMERIC(20,6) DEFAULT 0,
  tax_amount NUMERIC(20,6) DEFAULT 0,
  tax_ids UUID[] DEFAULT '{}',
  line_total NUMERIC(20,6) NOT NULL,
  source_type finance.source_type DEFAULT 'manual',
  source_id UUID,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES project.tasks(id) ON DELETE SET NULL,
  sales_order_line_id UUID
);
CREATE INDEX ON finance.invoice_lines (invoice_id);

CREATE TABLE finance.vendor_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  number TEXT UNIQUE,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  vendor_partner_id UUID NOT NULL REFERENCES catalog.partners(id),
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_terms_id UUID REFERENCES catalog.payment_terms(id),
  due_date DATE,
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  fx_rate NUMERIC(20,8),
  subtotal NUMERIC(20,6) NOT NULL DEFAULT 0,
  discount_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  grand_total NUMERIC(20,6) NOT NULL DEFAULT 0,
  base_currency_total NUMERIC(20,6),
  status finance.invoice_status NOT NULL DEFAULT 'draft',
  reference TEXT,
  notes TEXT,
  purchase_order_id UUID REFERENCES finance.purchase_orders(id) ON DELETE SET NULL,
  originated_from finance.source_type DEFAULT 'manual',
  posted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  bill_to_snapshot_json JSONB,
  ship_to_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON finance.vendor_bills (org_id, project_id, status);
CREATE INDEX ON finance.vendor_bills (vendor_partner_id, status);
CREATE TRIGGER trg_fin_vb_u BEFORE UPDATE ON finance.vendor_bills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE finance.bill_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES finance.vendor_bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES catalog.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  uom_id UUID REFERENCES catalog.uoms(id),
  unit_price NUMERIC(20,6) NOT NULL,
  discount_percent NUMERIC(7,4) DEFAULT 0,
  discount_amount NUMERIC(20,6) DEFAULT 0,
  tax_amount NUMERIC(20,6) DEFAULT 0,
  tax_ids UUID[] DEFAULT '{}',
  line_total NUMERIC(20,6) NOT NULL,
  purchase_order_line_id UUID
);
CREATE INDEX ON finance.bill_lines (bill_id);

CREATE TABLE finance.line_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  docline_type finance.docline_type NOT NULL,
  line_id UUID NOT NULL,
  tax_id UUID NOT NULL REFERENCES catalog.taxes(id),
  amount NUMERIC(20,6) NOT NULL
);
CREATE INDEX ON finance.line_taxes (org_id, docline_type, line_id);

CREATE TABLE finance.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES project.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL,
  amount NUMERIC(20,6) NOT NULL CHECK (amount >= 0),
  tax_amount NUMERIC(20,6) DEFAULT 0,
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  is_billable BOOLEAN NOT NULL DEFAULT FALSE,
  status finance.expense_status NOT NULL DEFAULT 'submitted',
  spent_on DATE,
  merchant TEXT,
  payment_method finance.payment_method DEFAULT 'other',
  distance_km NUMERIC(10,2),
  odometer_start NUMERIC(12,2),
  odometer_end NUMERIC(12,2),
  vendor_partner_id UUID REFERENCES catalog.partners(id) ON DELETE SET NULL,
  receipt_file_id UUID REFERENCES ops.files(id) ON DELETE SET NULL,
  note TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  invoice_line_id UUID,
  reimbursement_payment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON finance.expenses (org_id, project_id, status, is_billable);
CREATE INDEX ON finance.expenses (user_id, status);
CREATE TRIGGER trg_fin_exp_u BEFORE UPDATE ON finance.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE finance.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_no_mask TEXT,
  currency CHAR(3) REFERENCES catalog.currencies(code),
  provider_meta JSONB,
  UNIQUE(org_id, name)
);

CREATE TABLE finance.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES catalog.partners(id),
  partner_kind catalog.partner_type NOT NULL,
  method finance.payment_method NOT NULL,
  bank_account_id UUID REFERENCES finance.bank_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(20,6) NOT NULL CHECK (amount > 0),
  base_currency_amount NUMERIC(20,6),
  currency CHAR(3) NOT NULL REFERENCES catalog.currencies(code),
  fx_rate NUMERIC(20,8),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  txn_ref TEXT,
  reference TEXT,
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE finance.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.orgs(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES finance.payments(id) ON DELETE CASCADE,
  doc_type finance.alloc_doc_type NOT NULL,
  doc_id UUID NOT NULL,
  amount_applied NUMERIC(20,6) NOT NULL CHECK (amount_applied > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_id, doc_type, doc_id)
);
CREATE INDEX ON finance.payment_allocations (org_id, doc_type, doc_id);

-- Add foreign key constraints for back-references
ALTER TABLE project.milestones
  ADD CONSTRAINT milestones_invoice_fk FOREIGN KEY (invoice_id)
  REFERENCES finance.customer_invoices(id) ON DELETE SET NULL;

ALTER TABLE finance.invoice_lines
  ADD CONSTRAINT invoice_lines_so_line_fk FOREIGN KEY (sales_order_line_id)
  REFERENCES finance.sales_order_lines(id) ON DELETE SET NULL;

ALTER TABLE finance.bill_lines
  ADD CONSTRAINT bill_lines_po_line_fk FOREIGN KEY (purchase_order_line_id)
  REFERENCES finance.purchase_order_lines(id) ON DELETE SET NULL;

ALTER TABLE project.timesheets
  ADD CONSTRAINT timesheets_invline_fk FOREIGN KEY (invoice_line_id)
  REFERENCES finance.invoice_lines(id) ON DELETE SET NULL;

ALTER TABLE finance.expenses
  ADD CONSTRAINT expenses_invline_fk FOREIGN KEY (invoice_line_id)
  REFERENCES finance.invoice_lines(id) ON DELETE SET NULL;

ALTER TABLE finance.expenses
  ADD CONSTRAINT expenses_reimb_payment_fk FOREIGN KEY (reimbursement_payment_id)
  REFERENCES finance.payments(id) ON DELETE SET NULL;

-- =========================
-- ANALYTICS SCHEMA
-- =========================
CREATE MATERIALIZED VIEW analytics.mv_project_financials AS
SELECT
  p.org_id,
  p.id AS project_id,
  COALESCE(SUM(CASE WHEN ci.status IN ('posted','partially_paid','paid') THEN ci.grand_total ELSE 0 END),0) AS revenue,
  COALESCE(SUM(CASE WHEN vb.status IN ('posted','partially_paid','paid') THEN vb.grand_total ELSE 0 END),0)
    + COALESCE((SELECT SUM(e.amount) FROM finance.expenses e WHERE e.project_id = p.id AND e.status IN ('approved','reimbursed','paid')),0) AS cost,
  COALESCE(SUM(CASE WHEN ci.status IN ('posted','partially_paid','paid') THEN ci.grand_total ELSE 0 END),0)
    - (
      COALESCE(SUM(CASE WHEN vb.status IN ('posted','partially_paid','paid') THEN vb.grand_total ELSE 0 END),0)
      + COALESCE((SELECT SUM(e.amount) FROM finance.expenses e WHERE e.project_id = p.id AND e.status IN ('approved','reimbursed','paid')),0)
    ) AS profit
FROM project.projects p
LEFT JOIN finance.customer_invoices ci ON ci.project_id = p.id
LEFT JOIN finance.vendor_bills vb ON vb.project_id = p.id
GROUP BY p.org_id, p.id;
CREATE INDEX ON analytics.mv_project_financials (org_id, project_id);

CREATE MATERIALIZED VIEW analytics.mv_utilization AS
SELECT
  org_id,
  project_id,
  SUM(CASE WHEN is_billable THEN hours ELSE 0 END) AS billable_hours,
  SUM(CASE WHEN NOT is_billable THEN hours ELSE 0 END) AS non_billable_hours,
  SUM(hours) AS total_hours
FROM project.timesheets
GROUP BY org_id, project_id;
CREATE INDEX ON analytics.mv_utilization (org_id, project_id);

CREATE MATERIALIZED VIEW analytics.mv_delayed_tasks AS
SELECT
  t.org_id,
  t.project_id,
  COUNT(*) AS overdue_count,
  MAX((CURRENT_DATE - t.due_date))::INT AS max_delay_days
FROM project.tasks t
WHERE t.due_date IS NOT NULL
  AND t.state <> 'done'
  AND t.due_date < CURRENT_DATE
GROUP BY t.org_id, t.project_id;
CREATE INDEX ON analytics.mv_delayed_tasks (org_id, project_id);

-- Additional helpful indexes
CREATE INDEX ON project.tasks (project_id, list_id, position);

-- Insert some default master data
INSERT INTO catalog.currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('INR', 'Indian Rupee', '₹'),
  ('JPY', 'Japanese Yen', '¥')
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.uoms (code, name, precision) VALUES
  ('UNIT', 'Unit', 0),
  ('HOUR', 'Hour', 2),
  ('DAY', 'Day', 1),
  ('KG', 'Kilogram', 3),
  ('METER', 'Meter', 2)
ON CONFLICT (code) DO NOTHING;

-- =========================
-- COMPLETION
-- =========================
COMMENT ON SCHEMA auth IS 'Authentication and authorization tables (multi-tenant)';
COMMENT ON SCHEMA catalog IS 'Master data: partners, products, currencies, taxes';
COMMENT ON SCHEMA project IS 'Project management: projects, tasks, timesheets';
COMMENT ON SCHEMA finance IS 'Financial documents: orders, invoices, bills, payments';
COMMENT ON SCHEMA ops IS 'Operations: files, notifications, audit, webhooks';
COMMENT ON SCHEMA analytics IS 'Analytics materialized views for reporting';

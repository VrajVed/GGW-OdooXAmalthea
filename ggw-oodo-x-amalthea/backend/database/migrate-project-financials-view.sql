-- Migration: Update mv_project_financials to use dynamic revenue based on billable expenses
-- Revenue = Budget - (Sum of non-billable expenses)
-- Non-billable expenses reduce revenue, billable expenses don't affect revenue

DROP MATERIALIZED VIEW IF EXISTS analytics.mv_project_financials;

CREATE MATERIALIZED VIEW analytics.mv_project_financials AS
SELECT
  p.org_id,
  p.id AS project_id,
  -- Revenue = Budget - (Sum of non-billable expenses)
  -- Non-billable expenses reduce revenue, billable expenses don't affect revenue
  COALESCE(p.budget_amount, 0) 
    - COALESCE((
        SELECT SUM(e.amount) 
        FROM finance.expenses e 
        WHERE e.project_id = p.id 
        AND e.is_billable = FALSE
        AND e.status IN ('approved','reimbursed','paid')
      ), 0) AS revenue,
  -- Total Costs = Expenses (ALL) + Vendor Bills + Employee Wages + Purchase Orders
  COALESCE(SUM(CASE WHEN vb.status IN ('posted','partially_paid','paid') THEN vb.grand_total ELSE 0 END),0)
    + COALESCE((SELECT SUM(e.amount) FROM finance.expenses e WHERE e.project_id = p.id AND e.status IN ('approved','reimbursed','paid')),0)
    + COALESCE((SELECT SUM(t.hours * COALESCE(t.cost_rate, 0)) FROM project.timesheets t WHERE t.project_id = p.id),0)
    + COALESCE(SUM(CASE WHEN po.status IN ('confirmed','fulfilled') THEN po.grand_total ELSE 0 END),0) AS cost,
  -- Profit = Revenue - Total Costs
  (COALESCE(p.budget_amount, 0) 
    - COALESCE((
        SELECT SUM(e.amount) 
        FROM finance.expenses e 
        WHERE e.project_id = p.id 
        AND e.is_billable = FALSE
        AND e.status IN ('approved','reimbursed','paid')
      ), 0))
    - (
      COALESCE(SUM(CASE WHEN vb.status IN ('posted','partially_paid','paid') THEN vb.grand_total ELSE 0 END),0)
      + COALESCE((SELECT SUM(e.amount) FROM finance.expenses e WHERE e.project_id = p.id AND e.status IN ('approved','reimbursed','paid')),0)
      + COALESCE((SELECT SUM(t.hours * COALESCE(t.cost_rate, 0)) FROM project.timesheets t WHERE t.project_id = p.id),0)
      + COALESCE(SUM(CASE WHEN po.status IN ('confirmed','fulfilled') THEN po.grand_total ELSE 0 END),0)
    ) AS profit
FROM project.projects p
LEFT JOIN finance.vendor_bills vb ON vb.project_id = p.id
LEFT JOIN finance.purchase_orders po ON po.project_id = p.id
GROUP BY p.org_id, p.id, p.budget_amount;

CREATE INDEX ON analytics.mv_project_financials (org_id, project_id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW analytics.mv_project_financials;


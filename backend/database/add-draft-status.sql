-- Add 'draft' status to finance.expense_status enum
-- Run this SQL script to update the enum type
-- Note: If 'draft' already exists, this will fail with a harmless error

ALTER TYPE finance.expense_status ADD VALUE 'draft';


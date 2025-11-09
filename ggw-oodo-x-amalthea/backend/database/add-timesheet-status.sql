-- Add status enum and column to timesheets table
-- This allows us to properly track pending, approved, and rejected timesheets

-- Create enum for timesheet status
DO $$ BEGIN
    CREATE TYPE project.timesheet_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column with default value
ALTER TABLE project.timesheets 
ADD COLUMN IF NOT EXISTS status project.timesheet_status NOT NULL DEFAULT 'pending';

-- Update existing records based on approved_by field
UPDATE project.timesheets 
SET status = CASE 
    WHEN approved_by IS NOT NULL THEN 'approved'::project.timesheet_status
    WHEN note LIKE '%Rejected:%' THEN 'rejected'::project.timesheet_status
    ELSE 'pending'::project.timesheet_status
END
WHERE status = 'pending';

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON project.timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_org_status ON project.timesheets(org_id, status);

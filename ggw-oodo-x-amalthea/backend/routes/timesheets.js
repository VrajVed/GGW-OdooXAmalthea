/**
 * ============================================================================
 * Timesheets Routes - Timesheet Management API
 * ============================================================================
 * Endpoints for managing timesheets from project.timesheets schema
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================================================
// Helper: Get user's current rate
// ============================================================================
async function getUserRate(userId, orgId, date) {
    try {
        const rateQuery = `
            SELECT cost_rate, bill_rate, currency
            FROM project.user_rates
            WHERE user_id = $1 
            AND org_id = $2
            AND valid_from <= $3
            AND (valid_to IS NULL OR valid_to >= $3)
            ORDER BY valid_from DESC
            LIMIT 1
        `;
        const rateResult = await pool.query(rateQuery, [userId, orgId, date || new Date().toISOString().split('T')[0]]);
        
        if (rateResult.rows.length > 0) {
            return {
                costRate: parseFloat(rateResult.rows[0].cost_rate),
                billRate: parseFloat(rateResult.rows[0].bill_rate),
                currency: rateResult.rows[0].currency
            };
        }
        return { costRate: 0, billRate: 0, currency: 'INR' };
    } catch (error) {
        console.error('Error fetching user rate:', error);
        return { costRate: 0, billRate: 0, currency: 'INR' };
    }
}

// ============================================================================
// GET /api/timesheets - List timesheets with filtering
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const {
            project_id,
            task_id,
            user_id,
            is_billable,
            date_from,
            date_to,
            status,
            limit = 100,
            offset = 0
        } = req.query;

        // Get org_id
        let orgId = null;
        try {
            if (req.user?.id) {
                const orgQuery = await pool.query('SELECT org_id FROM auth.users WHERE id = $1 LIMIT 1', [req.user.id]);
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].org_id;
                }
            }
            if (!orgId) {
                const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].id;
                }
            }
        } catch (orgError) {
            console.warn('Could not determine org_id, proceeding without org filter:', orgError.message);
        }

        // Build WHERE clause dynamically
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`t.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`t.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (task_id) {
            conditions.push(`t.task_id = $${paramIndex++}`);
            params.push(task_id);
        }

        if (user_id) {
            conditions.push(`t.user_id = $${paramIndex++}`);
            params.push(user_id);
        }

        if (is_billable !== undefined) {
            conditions.push(`t.is_billable = $${paramIndex++}`);
            params.push(is_billable === 'true');
        }

        if (date_from) {
            conditions.push(`t.worked_on >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`t.worked_on <= $${paramIndex++}`);
            params.push(date_to);
        }

        // Status filter - compute from approved_by and note fields
        if (status) {
            if (status === 'pending') {
                conditions.push(`t.approved_by IS NULL AND (t.note IS NULL OR t.note NOT LIKE '%Rejected:%')`);
            } else if (status === 'approved') {
                conditions.push(`t.approved_by IS NOT NULL`);
            } else if (status === 'rejected') {
                conditions.push(`t.note LIKE '%Rejected:%'`);
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                t.id,
                t.project_id,
                t.task_id,
                t.user_id,
                t.worked_on,
                t.start_time,
                t.end_time,
                t.hours,
                t.is_billable,
                t.bill_rate,
                t.cost_rate,
                t.note,
                t.approved_by,
                t.approved_at,
                t.locked_at,
                t.invoice_line_id,
                t.created_at,
                u.full_name as user_name,
                u.email as user_email,
                p.name as project_name,
                task.title as task_title,
                approver.full_name as approver_name,
                (t.hours * COALESCE(t.cost_rate, 0)) as cost
            FROM project.timesheets t
            LEFT JOIN auth.users u ON t.user_id = u.id
            LEFT JOIN project.projects p ON t.project_id = p.id
            LEFT JOIN project.tasks task ON t.task_id = task.id
            LEFT JOIN auth.users approver ON t.approved_by = approver.id
            ${whereClause}
            ORDER BY t.worked_on DESC, t.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        let result;
        try {
            result = await pool.query(query, params);
        } catch (dbError) {
            console.error('Database query error:', dbError);
            console.error('Error code:', dbError.code);
            console.error('Error message:', dbError.message);
            console.error('Query:', query.replace(/\s+/g, ' ').trim());
            console.error('Params:', params);
            
            // Check if it's a "relation does not exist" error
            if (dbError.code === '42P01') {
                return res.status(500).json({
                    success: false,
                    message: 'Timesheets table does not exist. Please run the database schema migration.',
                    error: 'Table project.timesheets not found'
                });
            }
            
            throw dbError;
        }

        const timesheets = result.rows.map(row => ({
            id: row.id,
            projectId: row.project_id,
            projectName: row.project_name,
            taskId: row.task_id,
            taskTitle: row.task_title,
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            workedOn: row.worked_on ? row.worked_on.toISOString().split('T')[0] : null,
            startTime: row.start_time ? row.start_time.toISOString() : null,
            endTime: row.end_time ? row.end_time.toISOString() : null,
            hours: parseFloat(row.hours),
            isBillable: row.is_billable,
            billRate: row.bill_rate ? parseFloat(row.bill_rate) : null,
            costRate: row.cost_rate ? parseFloat(row.cost_rate) : null,
            cost: parseFloat(row.cost || 0),
            note: row.note,
            approvedBy: row.approved_by,
            approverName: row.approver_name,
            approvedAt: row.approved_at,
            lockedAt: row.locked_at,
            invoiceLineId: row.invoice_line_id,
            status: row.approved_by ? 'approved' : (row.note && row.note.includes('Rejected:') ? 'rejected' : 'pending'),
            createdAt: row.created_at
        }));

        res.status(200).json({
            success: true,
            data: timesheets,
            count: timesheets.length
        });

    } catch (error) {
        console.error('Error fetching timesheets:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timesheets',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
        });
    }
});

// ============================================================================
// GET /api/timesheets/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        // Get org_id
        let orgId = null;
        try {
            if (req.user?.id) {
                const orgQuery = await pool.query('SELECT org_id FROM auth.users WHERE id = $1 LIMIT 1', [req.user.id]);
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].org_id;
                }
            }
            if (!orgId) {
                const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].id;
                }
            }
        } catch (orgError) {
            console.warn('Could not determine org_id, proceeding without org filter:', orgError.message);
        }

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`t.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`t.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`t.worked_on >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`t.worked_on <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                COALESCE(SUM(t.hours), 0) as total_hours,
                COALESCE(SUM(t.hours) FILTER (WHERE t.is_billable = true), 0) as billable_hours,
                COUNT(*) FILTER (WHERE t.approved_by IS NULL AND (t.note IS NULL OR t.note NOT LIKE '%Rejected:%')) as pending_approvals,
                COALESCE(SUM(t.hours * COALESCE(t.cost_rate, 0)), 0) as total_cost
            FROM project.timesheets t
            ${whereClause}
        `;

        const result = await pool.query(query, params);
        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            data: {
                totalHours: parseFloat(stats.total_hours) || 0,
                billableHours: parseFloat(stats.billable_hours) || 0,
                pendingApprovals: parseInt(stats.pending_approvals) || 0,
                totalCost: parseFloat(stats.total_cost) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching timesheet stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timesheet stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/timesheets/:id - Get single timesheet with details
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                t.*,
                u.full_name as user_name,
                u.email as user_email,
                p.name as project_name,
                task.title as task_title,
                approver.full_name as approver_name,
                (t.hours * COALESCE(t.cost_rate, 0)) as cost
            FROM project.timesheets t
            LEFT JOIN auth.users u ON t.user_id = u.id
            LEFT JOIN project.projects p ON t.project_id = p.id
            LEFT JOIN project.tasks task ON t.task_id = task.id
            LEFT JOIN auth.users approver ON t.approved_by = approver.id
            WHERE t.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timesheet not found'
            });
        }

        const row = result.rows[0];
        const timesheet = {
            id: row.id,
            projectId: row.project_id,
            projectName: row.project_name,
            taskId: row.task_id,
            taskTitle: row.task_title,
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            workedOn: row.worked_on ? row.worked_on.toISOString().split('T')[0] : null,
            startTime: row.start_time ? row.start_time.toISOString() : null,
            endTime: row.end_time ? row.end_time.toISOString() : null,
            hours: parseFloat(row.hours),
            isBillable: row.is_billable,
            billRate: row.bill_rate ? parseFloat(row.bill_rate) : null,
            costRate: row.cost_rate ? parseFloat(row.cost_rate) : null,
            cost: parseFloat(row.cost || 0),
            note: row.note,
            approvedBy: row.approved_by,
            approverName: row.approver_name,
            approvedAt: row.approved_at,
            lockedAt: row.locked_at,
            invoiceLineId: row.invoice_line_id,
            status: row.approved_by ? 'approved' : (row.note && row.note.includes('Rejected:') ? 'rejected' : 'pending'),
            createdAt: row.created_at
        };

        res.status(200).json({
            success: true,
            data: timesheet
        });

    } catch (error) {
        console.error('Error fetching timesheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timesheet',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/timesheets/user-rates/:user_id - Get user's current rate
// ============================================================================
router.get('/user-rates/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { date } = req.query;

        // Get org_id
        let orgId = null;
        try {
            if (req.user?.id) {
                const orgQuery = await pool.query('SELECT org_id FROM auth.users WHERE id = $1 LIMIT 1', [req.user.id]);
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].org_id;
                }
            }
            if (!orgId) {
                const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].id;
                }
            }
        } catch (orgError) {
            console.warn('Could not determine org_id:', orgError.message);
        }

        if (!orgId) {
            return res.status(400).json({
                success: false,
                message: 'No organization found'
            });
        }

        const rate = await getUserRate(user_id, orgId, date);

        res.status(200).json({
            success: true,
            data: rate
        });

    } catch (error) {
        console.error('Error fetching user rate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user rate',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/timesheets - Create new timesheet entry
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            task_id,
            user_id,
            worked_on,
            start_time,
            end_time,
            hours,
            is_billable = true,
            note
        } = req.body;

        // Validate required fields
        if (!project_id || !user_id || !worked_on || !hours) {
            return res.status(400).json({
                success: false,
                message: 'Project, user, date worked, and hours are required'
            });
        }

        // Get org_id
        const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
        if (orgQuery.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No organization found'
            });
        }
        const orgId = orgQuery.rows[0].id;

        // ========================================================================
        // VALIDATION: Start time and end time validation
        // ========================================================================
        if (start_time && end_time) {
            const start = new Date(start_time);
            const end = new Date(end_time);
            
            // Check if end time is earlier than start time
            if (end <= start) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be later than start time',
                    field: 'end_time'
                });
            }
        }

        // Calculate hours from start/end time if provided
        let calculatedHours = parseFloat(hours);
        if (start_time && end_time && !hours) {
            const start = new Date(start_time);
            const end = new Date(end_time);
            calculatedHours = (end - start) / (1000 * 60 * 60); // Convert to hours
        }

        if (calculatedHours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hours must be greater than 0'
            });
        }

        // Get user rates
        const userRate = await getUserRate(user_id, orgId, worked_on);

        const query = `
            INSERT INTO project.timesheets (
                org_id,
                project_id,
                task_id,
                user_id,
                worked_on,
                start_time,
                end_time,
                hours,
                is_billable,
                bill_rate,
                cost_rate,
                note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            orgId,
            project_id,
            task_id || null,
            user_id,
            worked_on,
            start_time || null,
            end_time || null,
            calculatedHours,
            is_billable,
            userRate.billRate || null,
            userRate.costRate || null,
            note || null
        ];

        const result = await pool.query(query, values);
        const newTimesheet = result.rows[0];

        // Get related data
        const userQuery = await pool.query('SELECT full_name, email FROM auth.users WHERE id = $1', [user_id]);
        const projectQuery = await pool.query('SELECT name FROM project.projects WHERE id = $1', [project_id]);
        
        const userName = userQuery.rows[0]?.full_name || '';
        const projectName = projectQuery.rows[0]?.name || '';

        res.status(201).json({
            success: true,
            message: 'Timesheet created successfully',
            data: {
                id: newTimesheet.id,
                projectId: newTimesheet.project_id,
                projectName: projectName,
                taskId: newTimesheet.task_id,
                userId: newTimesheet.user_id,
                userName: userName,
                workedOn: newTimesheet.worked_on ? newTimesheet.worked_on.toISOString().split('T')[0] : null,
                startTime: newTimesheet.start_time ? newTimesheet.start_time.toISOString() : null,
                endTime: newTimesheet.end_time ? newTimesheet.end_time.toISOString() : null,
                hours: parseFloat(newTimesheet.hours),
                isBillable: newTimesheet.is_billable,
                billRate: newTimesheet.bill_rate ? parseFloat(newTimesheet.bill_rate) : null,
                costRate: newTimesheet.cost_rate ? parseFloat(newTimesheet.cost_rate) : null,
                cost: parseFloat(newTimesheet.hours) * parseFloat(newTimesheet.cost_rate || 0),
                note: newTimesheet.note,
                status: 'pending',
                createdAt: newTimesheet.created_at
            }
        });

    } catch (error) {
        console.error('Error creating timesheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create timesheet',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/timesheets/:id - Update timesheet (before approval)
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            task_id,
            user_id,
            worked_on,
            start_time,
            end_time,
            hours,
            is_billable,
            note
        } = req.body;

        // Check if timesheet exists and can be edited
        const checkQuery = 'SELECT id, approved_by FROM project.timesheets WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timesheet not found'
            });
        }

        if (checkResult.rows[0].approved_by && !req.body.force) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit approved timesheet'
            });
        }

        // Get current timesheet data
        const currentQuery = 'SELECT * FROM project.timesheets WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        const current = currentResult.rows[0];

        // ========================================================================
        // VALIDATION: Start time and end time validation
        // ========================================================================
        // Use provided values or current values for validation
        const finalStartTime = start_time !== undefined ? start_time : current.start_time;
        const finalEndTime = end_time !== undefined ? end_time : current.end_time;
        
        if (finalStartTime && finalEndTime) {
            const start = new Date(finalStartTime);
            const end = new Date(finalEndTime);
            
            // Check if end time is earlier than start time
            if (end <= start) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be later than start time',
                    field: 'end_time'
                });
            }
        }

        // Calculate hours
        let calculatedHours = hours ? parseFloat(hours) : current.hours;
        if (finalStartTime && finalEndTime && !hours) {
            const start = new Date(finalStartTime);
            const end = new Date(finalEndTime);
            calculatedHours = (end - start) / (1000 * 60 * 60);
        }

        if (calculatedHours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hours must be greater than 0'
            });
        }

        // Get org_id
        const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
        const orgId = orgQuery.rows[0].id;

        // Get user rates if user_id changed
        const finalUserId = user_id || current.user_id;
        const finalWorkedOn = worked_on || current.worked_on;
        const userRate = await getUserRate(finalUserId, orgId, finalWorkedOn);

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (project_id !== undefined) {
            updateFields.push(`project_id = $${paramIndex++}`);
            values.push(project_id);
        }
        if (task_id !== undefined) {
            updateFields.push(`task_id = $${paramIndex++}`);
            values.push(task_id || null);
        }
        if (user_id !== undefined) {
            updateFields.push(`user_id = $${paramIndex++}`);
            values.push(user_id);
            updateFields.push(`cost_rate = $${paramIndex++}`);
            values.push(userRate.costRate || null);
            updateFields.push(`bill_rate = $${paramIndex++}`);
            values.push(userRate.billRate || null);
        }
        if (worked_on !== undefined) {
            updateFields.push(`worked_on = $${paramIndex++}`);
            values.push(worked_on);
            // Recalculate rates if date changed
            if (!user_id) {
                updateFields.push(`cost_rate = $${paramIndex++}`);
                values.push(userRate.costRate || null);
                updateFields.push(`bill_rate = $${paramIndex++}`);
                values.push(userRate.billRate || null);
            }
        }
        if (start_time !== undefined) {
            updateFields.push(`start_time = $${paramIndex++}`);
            values.push(start_time || null);
        }
        if (end_time !== undefined) {
            updateFields.push(`end_time = $${paramIndex++}`);
            values.push(end_time || null);
        }
        if (hours !== undefined || start_time || end_time) {
            updateFields.push(`hours = $${paramIndex++}`);
            values.push(calculatedHours);
        }
        if (is_billable !== undefined) {
            updateFields.push(`is_billable = $${paramIndex++}`);
            values.push(is_billable);
        }
        if (note !== undefined) {
            updateFields.push(`note = $${paramIndex++}`);
            values.push(note || null);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        const query = `
            UPDATE project.timesheets
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedTimesheet = result.rows[0];

        // Get related data
        const userQuery = await pool.query('SELECT full_name, email FROM auth.users WHERE id = $1', [updatedTimesheet.user_id]);
        const projectQuery = await pool.query('SELECT name FROM project.projects WHERE id = $1', [updatedTimesheet.project_id]);
        
        const userName = userQuery.rows[0]?.full_name || '';
        const projectName = projectQuery.rows[0]?.name || '';

        res.status(200).json({
            success: true,
            message: 'Timesheet updated successfully',
            data: {
                id: updatedTimesheet.id,
                projectId: updatedTimesheet.project_id,
                projectName: projectName,
                taskId: updatedTimesheet.task_id,
                userId: updatedTimesheet.user_id,
                userName: userName,
                workedOn: updatedTimesheet.worked_on ? updatedTimesheet.worked_on.toISOString().split('T')[0] : null,
                startTime: updatedTimesheet.start_time ? updatedTimesheet.start_time.toISOString() : null,
                endTime: updatedTimesheet.end_time ? updatedTimesheet.end_time.toISOString() : null,
                hours: parseFloat(updatedTimesheet.hours),
                isBillable: updatedTimesheet.is_billable,
                billRate: updatedTimesheet.bill_rate ? parseFloat(updatedTimesheet.bill_rate) : null,
                costRate: updatedTimesheet.cost_rate ? parseFloat(updatedTimesheet.cost_rate) : null,
                cost: parseFloat(updatedTimesheet.hours) * parseFloat(updatedTimesheet.cost_rate || 0),
                note: updatedTimesheet.note,
                status: updatedTimesheet.approved_by ? 'approved' : 'pending',
                createdAt: updatedTimesheet.created_at
            }
        });

    } catch (error) {
        console.error('Error updating timesheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update timesheet',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/timesheets/:id/approve - Approve timesheet
// ============================================================================
router.patch('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get approver user ID
        let approverId = req.user?.id;
        if (!approverId) {
            const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
            if (orgQuery.rows.length > 0) {
                const userQuery = await pool.query('SELECT id FROM auth.users WHERE org_id = $1 LIMIT 1', [orgQuery.rows[0].id]);
                if (userQuery.rows.length > 0) {
                    approverId = userQuery.rows[0].id;
                } else {
                    const anyUserQuery = await pool.query('SELECT id FROM auth.users LIMIT 1');
                    if (anyUserQuery.rows.length > 0) {
                        approverId = anyUserQuery.rows[0].id;
                    }
                }
            }
        }
        
        if (!approverId) {
            return res.status(400).json({
                success: false,
                message: 'No approver user found'
            });
        }

        // Check if timesheet exists
        const checkQuery = 'SELECT id, approved_by FROM project.timesheets WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timesheet not found'
            });
        }

        if (checkResult.rows[0].approved_by) {
            return res.status(400).json({
                success: false,
                message: 'Timesheet is already approved'
            });
        }

        // Approve timesheet
        const updateQuery = `
            UPDATE project.timesheets
            SET approved_by = $1,
                approved_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [approverId, id]);
        const approvedTimesheet = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Timesheet approved successfully',
            data: {
                id: approvedTimesheet.id,
                approvedBy: approvedTimesheet.approved_by,
                approvedAt: approvedTimesheet.approved_at,
                status: 'approved'
            }
        });

    } catch (error) {
        console.error('Error approving timesheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve timesheet',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/timesheets/:id/reject - Reject timesheet with reason
// ============================================================================
router.patch('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Check if timesheet exists
        const checkQuery = 'SELECT id, note FROM project.timesheets WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timesheet not found'
            });
        }

        // Update note with rejection reason and set status to rejected
        const currentNote = checkResult.rows[0].note || '';
        const rejectionNote = `${currentNote}\n\nRejected: ${reason}`.trim();

        const updateQuery = `
            UPDATE project.timesheets
            SET note = $1,
                approved_by = NULL,
                approved_at = NULL
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [rejectionNote, id]);
        const rejectedTimesheet = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Timesheet rejected successfully',
            data: {
                id: rejectedTimesheet.id,
                note: rejectedTimesheet.note,
                status: 'rejected'
            }
        });

    } catch (error) {
        console.error('Error rejecting timesheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject timesheet',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/timesheets/bulk-approve - Bulk approve timesheets
// ============================================================================
router.post('/bulk-approve', async (req, res) => {
    try {
        const { timesheet_ids } = req.body;
        
        // Get approver user ID
        let approverId = req.user?.id;
        if (!approverId) {
            const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
            if (orgQuery.rows.length > 0) {
                const userQuery = await pool.query('SELECT id FROM auth.users WHERE org_id = $1 LIMIT 1', [orgQuery.rows[0].id]);
                if (userQuery.rows.length > 0) {
                    approverId = userQuery.rows[0].id;
                } else {
                    const anyUserQuery = await pool.query('SELECT id FROM auth.users LIMIT 1');
                    if (anyUserQuery.rows.length > 0) {
                        approverId = anyUserQuery.rows[0].id;
                    }
                }
            }
        }
        
        if (!approverId) {
            return res.status(400).json({
                success: false,
                message: 'No approver user found'
            });
        }

        if (!timesheet_ids || !Array.isArray(timesheet_ids) || timesheet_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'timesheet_ids array is required'
            });
        }

        // Get timesheets that can be approved (not already approved)
        const checkQuery = `
            SELECT id
            FROM project.timesheets
            WHERE id = ANY($1::uuid[])
            AND approved_by IS NULL
        `;
        const checkResult = await pool.query(checkQuery, [timesheet_ids]);

        if (checkResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No timesheets can be approved (all may already be approved)'
            });
        }

        const validIds = checkResult.rows.map(row => row.id);

        // Approve valid timesheets
        const updateQuery = `
            UPDATE project.timesheets
            SET approved_by = $1,
                approved_at = NOW()
            WHERE id = ANY($2::uuid[])
            RETURNING id
        `;

        const result = await pool.query(updateQuery, [approverId, validIds]);

        res.status(200).json({
            success: true,
            message: `Approved ${result.rows.length} timesheet(s)`,
            data: {
                approved: result.rows.length,
                failed: timesheet_ids.length - result.rows.length
            }
        });

    } catch (error) {
        console.error('Error bulk approving timesheets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk approve timesheets',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/timesheets/bulk-reject - Bulk reject timesheets
// ============================================================================
router.post('/bulk-reject', async (req, res) => {
    try {
        const { timesheet_ids, reason } = req.body;

        if (!timesheet_ids || !Array.isArray(timesheet_ids) || timesheet_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'timesheet_ids array is required'
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Get current notes
        const checkQuery = 'SELECT id, note FROM project.timesheets WHERE id = ANY($1::uuid[])';
        const checkResult = await pool.query(checkQuery, [timesheet_ids]);

        // Update each timesheet with rejection reason
        const updatePromises = checkResult.rows.map(row => {
            const currentNote = row.note || '';
            const rejectionNote = `${currentNote}\n\nRejected: ${reason}`.trim();
            return pool.query(
                'UPDATE project.timesheets SET note = $1, approved_by = NULL, approved_at = NULL WHERE id = $2',
                [rejectionNote, row.id]
            );
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Rejected ${checkResult.rows.length} timesheet(s)`,
            data: {
                rejected: checkResult.rows.length
            }
        });

    } catch (error) {
        console.error('Error bulk rejecting timesheets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk reject timesheets',
            error: error.message
        });
    }
});

module.exports = router;


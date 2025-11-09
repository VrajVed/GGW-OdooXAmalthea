/**
 * ============================================================================
 * Project Routes - Project Management API
 * ============================================================================
 * Endpoints for managing projects from project.projects schema
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================================================
// GET /api/projects - Get all projects
// Query Parameters:
//   - user_id: Filter projects where user is a member (employee view)
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;
        
        let query, queryParams = [];
        
        if (user_id) {
            // Employee view: Get only projects where user is a member
            query = `
                SELECT DISTINCT
                    p.id,
                    p.name,
                    p.description,
                    p.status,
                    p.start_date as start,
                    p.end_date as due,
                    p.progress_pct as progress,
                    p.tags,
                    p.color,
                    p.extra,
                    u.full_name as manager_name,
                    u.email as manager_email,
                    (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id) as tasks,
                    p.created_at,
                    p.updated_at
                FROM project.projects p
                LEFT JOIN auth.users u ON p.manager_user_id = u.id
                INNER JOIN project.project_members pm ON pm.project_id = p.id
                WHERE p.archived_at IS NULL 
                  AND pm.user_id = $1
                ORDER BY p.created_at DESC
            `;
            queryParams = [user_id];
        } else {
            // Manager view: Get all projects
            query = `
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.status,
                    p.start_date as start,
                    p.end_date as due,
                    p.progress_pct as progress,
                    p.tags,
                    p.color,
                    p.extra,
                    u.full_name as manager_name,
                    u.email as manager_email,
                    (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id) as tasks,
                    p.created_at,
                    p.updated_at
                FROM project.projects p
                LEFT JOIN auth.users u ON p.manager_user_id = u.id
                WHERE p.archived_at IS NULL
                ORDER BY p.created_at DESC
            `;
        }
        
        const result = await pool.query(query, queryParams);
        
        // Transform database records to match frontend format
        const projects = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            status: mapDatabaseStatus(row.status),
            start: row.start ? row.start.toISOString().split('T')[0] : null,
            due: row.due ? row.due.toISOString().split('T')[0] : null,
            tasks: parseInt(row.tasks) || 0,
            progress: parseFloat(row.progress) || 0,
            manager: {
                name: row.manager_name || 'Unassigned',
                email: row.manager_email
            },
            tags: row.tags || [],
            color: row.color,
            image: row.extra?.image || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: projects,
            count: projects.length
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/projects/:id - Get single project
// Query Parameters:
//   - user_id: If provided, verify user is a member (employee view)
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query;
        
        const query = `
            SELECT 
                p.*,
                u.full_name as manager_name,
                u.email as manager_email,
                (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id) as task_count
            FROM project.projects p
            LEFT JOIN auth.users u ON p.manager_user_id = u.id
            WHERE p.id = $1 AND p.archived_at IS NULL
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // ========================================================================
        // AUTHORIZATION CHECK: Verify user has access to this project
        // ========================================================================
        if (user_id) {
            // Employee view: Check if user is a project member
            const memberCheck = await pool.query(
                'SELECT id FROM project.project_members WHERE project_id = $1 AND user_id = $2',
                [id, user_id]
            );
            
            if (memberCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not a member of this project.'
                });
            }
        }

        const row = result.rows[0];
        
        // Calculate financials
        const financials = await calculateProjectFinancials(id);
        
        const project = {
            id: row.id,
            name: row.name,
            description: row.description,
            status: mapDatabaseStatus(row.status),
            start: row.start_date ? row.start_date.toISOString().split('T')[0] : null,
            due: row.end_date ? row.end_date.toISOString().split('T')[0] : null,
            tasks: parseInt(row.task_count) || 0,
            progress: parseFloat(row.progress_pct) || 0,
            manager: {
                name: row.manager_name || 'Unassigned',
                email: row.manager_email
            },
            tags: row.tags || [],
            color: row.color,
            billingType: row.billing_type,
            budget: row.budget_amount ? parseFloat(row.budget_amount) : 0,
            currency: row.budget_currency || 'INR',
            financials: financials || {
                budget: row.budget_amount ? parseFloat(row.budget_amount) : 0,
                revenue: row.budget_amount ? parseFloat(row.budget_amount) : 0,
                totalCosts: 0,
                profit: row.budget_amount ? parseFloat(row.budget_amount) : 0,
                costBreakdown: {
                    expenses: 0,
                    vendorBills: 0,
                    employeeWages: 0,
                    purchaseOrders: 0
                },
                currency: row.budget_currency || 'INR'
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        res.status(200).json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/projects - Create new project
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            status,
            start,
            due,
            managerEmail,
            tags,
            color,
            image,
            budget_amount,
            budget_currency
        } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // Validate budget_amount if provided
        if (budget_amount !== undefined && budget_amount !== null) {
            const budgetValue = parseFloat(budget_amount);
            if (isNaN(budgetValue) || budgetValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Budget amount must be a non-negative number'
                });
            }
        }

        // Get org_id (for now, use the first org or you'll need to pass it from frontend)
        const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
        if (orgQuery.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No organization found. Please create an organization first.'
            });
        }
        const orgId = orgQuery.rows[0].id;

        // Find manager by email if provided
        let managerUserId = null;
        if (managerEmail) {
            const managerQuery = await pool.query(
                'SELECT id FROM auth.users WHERE email = $1 AND org_id = $2',
                [managerEmail, orgId]
            );
            if (managerQuery.rows.length > 0) {
                managerUserId = managerQuery.rows[0].id;
            }
        }

        const dbStatus = mapFrontendStatus(status);

        // Prepare extra column with image if provided
        let extraData = {};
        if (image && image.base64) {
            extraData.image = image;
        }

        const query = `
            INSERT INTO project.projects (
                org_id,
                name,
                description,
                status,
                start_date,
                end_date,
                manager_user_id,
                tags,
                color,
                progress_pct,
                budget_amount,
                budget_currency,
                extra
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            orgId,
            name.trim(),
            description || null,
            dbStatus,
            start || null,
            due || null,
            managerUserId,
            tags || [],
            color || null,
            0, // Initial progress
            budget_amount !== undefined && budget_amount !== null ? parseFloat(budget_amount) : 0,
            budget_currency || 'INR',
            JSON.stringify(extraData)
        ];

        const result = await pool.query(query, values);
        const newProject = result.rows[0];

        // ========================================================================
        // ADD PROJECT MANAGER AS PROJECT MEMBER (if manager exists)
        // ========================================================================
        // WHY: Employees can only see projects they are members of
        // The project manager should automatically be a member
        if (managerUserId) {
            try {
                await pool.query(
                    `INSERT INTO project.project_members (org_id, project_id, user_id, role)
                     VALUES ($1, $2, $3, 'project_manager')
                     ON CONFLICT (project_id, user_id) DO NOTHING`,
                    [orgId, newProject.id, managerUserId]
                );
                console.log('Project manager added as member:', {
                    projectId: newProject.id,
                    managerId: managerUserId
                });
            } catch (memberError) {
                console.error('Error adding project manager as member:', memberError);
                // Don't fail the request, but log the error
            }
        }

        // ========================================================================
        // ADD CURRENT USER AS PROJECT MEMBER (whoever created the project)
        // ========================================================================
        // Get current user from request (if authenticated)
        // This ensures the creator can always see the project they created
        const currentUserId = req.user?.id;
        if (currentUserId) {
            try {
                // Get user's role from auth.users table
                const userRoleQuery = await pool.query(
                    'SELECT role FROM auth.users WHERE id = $1',
                    [currentUserId]
                );
                // Map auth.users.role to project.project_members.role
                // auth.users.role can be: 'admin', 'project_manager', 'team_member'
                // project.project_members.role uses auth.role_type which should match
                const userRole = userRoleQuery.rows[0]?.role || 'team_member';
                
                await pool.query(
                    `INSERT INTO project.project_members (org_id, project_id, user_id, role)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (project_id, user_id) DO NOTHING`,
                    [orgId, newProject.id, currentUserId, userRole]
                );
                console.log('Current user added as project member:', {
                    projectId: newProject.id,
                    userId: currentUserId,
                    role: userRole
                });
            } catch (memberError) {
                console.error('Error adding current user as member:', memberError);
                // Don't fail the request, but log the error
            }
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                id: newProject.id,
                name: newProject.name,
                description: newProject.description,
                status: mapDatabaseStatus(newProject.status),
                start: newProject.start_date ? newProject.start_date.toISOString().split('T')[0] : null,
                due: newProject.end_date ? newProject.end_date.toISOString().split('T')[0] : null,
                tasks: 0,
                progress: 0,
                manager: { name: 'Unassigned' },
                tags: newProject.tags || [],
                color: newProject.color,
                budget: parseFloat(newProject.budget_amount) || 0,
                currency: newProject.budget_currency || 'INR',
                image: newProject.extra?.image || null
            }
        });

    } catch (error) {
        console.error('Error creating project:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'A project with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create project',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/projects/:id - Update project
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            status,
            start,
            due,
            progress,
            tags,
            color,
            image,
            budget_amount,
            budget_currency
        } = req.body;

        // Validate budget_amount if provided
        if (budget_amount !== undefined && budget_amount !== null) {
            const budgetValue = parseFloat(budget_amount);
            if (isNaN(budgetValue) || budgetValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Budget amount must be a non-negative number'
                });
            }
        }

        // Check if project exists and get current extra data
        const checkQuery = 'SELECT id, extra FROM project.projects WHERE id = $1 AND archived_at IS NULL';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const dbStatus = mapFrontendStatus(status);

        // Handle image update in extra column
        let extraUpdate = '';
        let budgetUpdate = '';
        const values = [
            name || null,
            description !== undefined ? description : null,
            dbStatus || null,
            start !== undefined ? start : null,
            due !== undefined ? due : null,
            progress !== undefined ? progress : null,
            tags || null,
            color || null,
            id
        ];

        let paramIndex = values.length;

        // Handle budget fields
        if (budget_amount !== undefined) {
            budgetUpdate = `, budget_amount = $${++paramIndex}, budget_currency = $${++paramIndex}`;
            values.push(
                budget_amount !== null ? parseFloat(budget_amount) : 0,
                budget_currency || 'INR'
            );
        }

        // If image is explicitly provided (including null to remove)
        if (image !== undefined) {
            if (image === null) {
                // Remove image from extra
                extraUpdate = ", extra = COALESCE(extra, '{}'::jsonb) - 'image'";
            } else if (image.base64) {
                // Add or update image in extra
                extraUpdate = `, extra = jsonb_set(COALESCE(extra, '{}'::jsonb), '{image}', $${++paramIndex}::jsonb)`;
                values.push(JSON.stringify(image));
            }
        }

        const query = `
            UPDATE project.projects
            SET 
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                start_date = $4,
                end_date = $5,
                progress_pct = COALESCE($6, progress_pct),
                tags = COALESCE($7, tags),
                color = COALESCE($8, color),
                updated_at = NOW()
                ${budgetUpdate}
                ${extraUpdate}
            WHERE id = $9
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedProject = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: {
                id: updatedProject.id,
                name: updatedProject.name,
                description: updatedProject.description,
                status: mapDatabaseStatus(updatedProject.status),
                start: updatedProject.start_date ? updatedProject.start_date.toISOString().split('T')[0] : null,
                due: updatedProject.end_date ? updatedProject.end_date.toISOString().split('T')[0] : null,
                progress: parseFloat(updatedProject.progress_pct) || 0,
                tags: updatedProject.tags || [],
                color: updatedProject.color,
                budget: parseFloat(updatedProject.budget_amount) || 0,
                currency: updatedProject.budget_currency || 'INR',
                image: updatedProject.extra?.image || null
            }
        });

    } catch (error) {
        console.error('Error updating project:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'A project with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update project',
            error: error.message
        });
    }
});

// ============================================================================
// DELETE /api/projects/:id - Delete (archive) project
// ============================================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting archived_at
        const query = `
            UPDATE project.projects
            SET archived_at = NOW()
            WHERE id = $1 AND archived_at IS NULL
            RETURNING id
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or already deleted'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: error.message
        });
    }
});

// ============================================================================
// Helper: Calculate Project Financials
// ============================================================================
async function calculateProjectFinancials(projectId) {
    try {
        // Get project budget
        const projectQuery = await pool.query(
            'SELECT budget_amount, budget_currency FROM project.projects WHERE id = $1',
            [projectId]
        );
        
        if (projectQuery.rows.length === 0) {
            return null;
        }

        const budget = parseFloat(projectQuery.rows[0].budget_amount) || 0;
        const budgetCurrency = projectQuery.rows[0].budget_currency || 'INR';
        
        // Calculate revenue: Budget - (Sum of non-billable expenses)
        // Non-billable expenses reduce revenue, billable expenses don't affect revenue
        const nonBillableExpensesQuery = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM finance.expenses
            WHERE project_id = $1 
            AND is_billable = FALSE
            AND status IN ('approved', 'reimbursed', 'paid')
        `;
        const nonBillableResult = await pool.query(nonBillableExpensesQuery, [projectId]);
        const nonBillableExpenses = parseFloat(nonBillableResult.rows[0].total) || 0;
        
        // Revenue = Budget - Non-billable expenses
        const revenue = budget - nonBillableExpenses;

        // Calculate costs from different sources
        // 1. Expenses (approved/reimbursed/paid) - ALL expenses count as costs
        const expensesQuery = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM finance.expenses
            WHERE project_id = $1 
            AND status IN ('approved', 'reimbursed', 'paid')
        `;
        const expensesResult = await pool.query(expensesQuery, [projectId]);
        const expensesCost = parseFloat(expensesResult.rows[0].total) || 0;

               // 2. Vendor Bills (posted/partially_paid/paid)
        const vendorBillsQuery = `
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM finance.vendor_bills
            WHERE project_id = $1 
            AND status IN ('posted', 'partially_paid', 'paid')
        `;
        const vendorBillsResult = await pool.query(vendorBillsQuery, [projectId]);
        const vendorBillsCost = parseFloat(vendorBillsResult.rows[0].total) || 0;

        // 3. Employee Wages (timesheets: hours × cost_rate)
        const timesheetsQuery = `
            SELECT COALESCE(SUM(hours * COALESCE(cost_rate, 0)), 0) as total
            FROM project.timesheets
            WHERE project_id = $1
        `;
        const timesheetsResult = await pool.query(timesheetsQuery, [projectId]);
        const timesheetsCost = parseFloat(timesheetsResult.rows[0].total) || 0;

        // 4. Purchase Orders (confirmed/fulfilled)
        const purchaseOrdersQuery = `
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM finance.purchase_orders
            WHERE project_id = $1 
            AND status IN ('confirmed', 'fulfilled')
        `;
        const purchaseOrdersResult = await pool.query(purchaseOrdersQuery, [projectId]);
        const purchaseOrdersCost = parseFloat(purchaseOrdersResult.rows[0].total) || 0;

        // Total costs
        const totalCosts = expensesCost + vendorBillsCost + timesheetsCost + purchaseOrdersCost;

        // Profit = Budget - Total Costs
        const profit = revenue - totalCosts;

        return {
            budget,
            revenue,
            totalCosts,
            profit,
            costBreakdown: {
                expenses: expensesCost,
                vendorBills: vendorBillsCost,
                employeeWages: timesheetsCost,
                purchaseOrders: purchaseOrdersCost,
                nonBillableExpenses: nonBillableExpenses
            },
            currency: budgetCurrency
        };
    } catch (error) {
        console.error('Error calculating project financials:', error);
        return null;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map database status enum to frontend status
 * Database: planned, in_progress, completed, on_hold, cancelled
 * Frontend: New, In Progress, Completed
 */
function mapDatabaseStatus(dbStatus) {
    const statusMap = {
        'planned': 'New',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'on_hold': 'In Progress',
        'cancelled': 'Completed'
    };
    return statusMap[dbStatus] || 'New';
}

/**
 * Map frontend status to database status enum
 */
function mapFrontendStatus(frontendStatus) {
    const statusMap = {
        'New': 'planned',
        'In Progress': 'in_progress',
        'Completed': 'completed'
    };
    return statusMap[frontendStatus] || 'planned';
}

module.exports = router;

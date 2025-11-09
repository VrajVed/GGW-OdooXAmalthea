/**
 * ============================================================================
 * Dashboard Routes - Dashboard Statistics & KPIs
 * ============================================================================
 * Endpoints for dashboard metrics, project cards, and analytics
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================================================
// GET /api/dashboard/stats - Get dashboard KPI statistics
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        // Get Active Projects count
        const activeProjectsQuery = `
            SELECT COUNT(*) as count
            FROM project.projects
            WHERE status IN ('planned', 'in_progress', 'on_hold')
            AND archived_at IS NULL
        `;
        const activeProjectsResult = await pool.query(activeProjectsQuery);
        const activeProjects = parseInt(activeProjectsResult.rows[0].count) || 0;

        // Get Delayed Tasks count (tasks past due date and not done)
        const delayedTasksQuery = `
            SELECT COUNT(*) as count
            FROM project.tasks
            WHERE due_date < CURRENT_DATE
            AND state != 'done'
        `;
        const delayedTasksResult = await pool.query(delayedTasksQuery);
        const delayedTasks = parseInt(delayedTasksResult.rows[0].count) || 0;

        // Get Total Hours Logged from timesheets
        const hoursLoggedQuery = `
            SELECT COALESCE(SUM(hours), 0) as total_hours
            FROM project.timesheets
        `;
        const hoursLoggedResult = await pool.query(hoursLoggedQuery);
        const hoursLogged = parseFloat(hoursLoggedResult.rows[0].total_hours) || 0;

        // Get Revenue Earned from approved expenses
        const revenueQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_revenue
            FROM finance.expenses
            WHERE status = 'approved'
        `;
        const revenueResult = await pool.query(revenueQuery);
        const revenueEarned = parseFloat(revenueResult.rows[0].total_revenue) || 0;

        res.status(200).json({
            success: true,
            data: {
                activeProjects,
                delayedTasks,
                hoursLogged: Math.round(hoursLogged * 10) / 10, // Round to 1 decimal
                revenueEarned: Math.round(revenueEarned * 100) / 100 // Round to 2 decimals
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/dashboard/projects - Get all projects for dashboard with filters
// ============================================================================
router.get('/projects', async (req, res) => {
    try {
        const { status } = req.query; // Filter by status: planned, in_progress, completed, on_hold

        let statusFilter = '';
        const queryParams = [];

        if (status) {
            // Map frontend filter to database status
            const statusMap = {
                'planned': 'planned',
                'in_progress': 'in_progress',
                'completed': 'completed',
                'on_hold': 'on_hold'
            };
            
            if (statusMap[status.toLowerCase()]) {
                statusFilter = 'AND p.status = $1';
                queryParams.push(statusMap[status.toLowerCase()]);
            }
        }

        const query = `
            SELECT 
                p.id,
                p.name,
                p.description,
                p.status,
                p.start_date,
                p.end_date,
                p.progress_pct,
                p.tags,
                p.color,
                p.budget_amount,
                p.budget_currency,
                p.extra,
                u.full_name as manager_name,
                u.email as manager_email,
                (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id) as total_tasks,
                (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id AND t.state = 'done') as completed_tasks,
                (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id AND t.due_date < CURRENT_DATE AND t.state != 'done') as delayed_tasks,
                p.created_at,
                p.updated_at
            FROM project.projects p
            LEFT JOIN auth.users u ON p.manager_user_id = u.id
            WHERE p.archived_at IS NULL
            ${statusFilter}
            ORDER BY 
                CASE p.status
                    WHEN 'in_progress' THEN 1
                    WHEN 'planned' THEN 2
                    WHEN 'on_hold' THEN 3
                    WHEN 'completed' THEN 4
                    ELSE 5
                END,
                p.created_at DESC
        `;

        const result = await pool.query(query, queryParams);

        // Transform data for frontend
        const projects = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            statusLabel: mapDatabaseStatusToLabel(row.status),
            start: row.start_date ? row.start_date.toISOString().split('T')[0] : null,
            due: row.end_date ? row.end_date.toISOString().split('T')[0] : null,
            progress: parseFloat(row.progress_pct) || 0,
            manager: {
                name: row.manager_name || 'Unassigned',
                email: row.manager_email
            },
            tags: row.tags || [],
            color: row.color,
            budget: {
                amount: row.budget_amount,
                currency: row.budget_currency || 'INR'
            },
            image: row.extra?.image || null,
            tasks: {
                total: parseInt(row.total_tasks) || 0,
                completed: parseInt(row.completed_tasks) || 0,
                delayed: parseInt(row.delayed_tasks) || 0
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: projects,
            count: projects.length
        });

    } catch (error) {
        console.error('Error fetching dashboard projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard projects',
            error: error.message
        });
    }
});

// ============================================================================
// Helper Functions
// ============================================================================
function mapDatabaseStatusToLabel(dbStatus) {
    const statusMap = {
        'planned': 'Planned',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'on_hold': 'On Hold',
        'cancelled': 'Cancelled'
    };
    return statusMap[dbStatus] || 'Unknown';
}

module.exports = router;

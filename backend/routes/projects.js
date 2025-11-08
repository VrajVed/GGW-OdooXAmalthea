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
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const query = `
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
        
        const result = await pool.query(query);
        
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
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
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

        const row = result.rows[0];
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
            budget: row.budget_amount,
            currency: row.budget_currency,
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
            color
        } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
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
                progress_pct
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            0 // Initial progress
        ];

        const result = await pool.query(query, values);
        const newProject = result.rows[0];

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
                color: newProject.color
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
            color
        } = req.body;

        // Check if project exists
        const checkQuery = 'SELECT id FROM project.projects WHERE id = $1 AND archived_at IS NULL';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const dbStatus = mapFrontendStatus(status);

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
            WHERE id = $9
            RETURNING *
        `;

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
                color: updatedProject.color
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

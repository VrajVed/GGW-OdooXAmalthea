/**
 * ============================================================================
 * Task Routes - Task Management API
 * ============================================================================
 * Endpoints for managing tasks within projects
 * 
 * LEARNING NOTES:
 * - Tasks are nested resources under projects (/projects/:id/tasks)
 * - Each task MUST belong to a project and organization
 * - Tasks can optionally belong to a task_list (board/column)
 * ============================================================================
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
// 👆 IMPORTANT: mergeParams allows us to access :id from parent route

const { pool } = require('../config/database');

// ============================================================================
// POST /api/projects/:id/tasks - Create a new task
// ============================================================================
/**
 * WHAT THIS ENDPOINT DOES:
 * Creates a new task under a specific project
 * 
 * WHY WE VALIDATE IN THIS ORDER:
 * 1. Check request body (fail fast - no DB hit)
 * 2. Check project exists (fail before data entry)
 * 3. Insert task (only after validations pass)
 * 
 * POSTGRES BEST PRACTICES USED:
 * - Use parameterized queries ($1, $2) to prevent SQL injection
 * - Use RETURNING * to get the created record (avoids second query)
 * - Use transactions when multiple operations need to be atomic
 * - Let database generate UUIDs (more efficient than app-side generation)
 */
router.post('/', async (req, res) => {
    try {
        const projectId = req.params.id;  // From URL: /projects/:id/tasks
        const {
            title,
            description,
            state,
            priority,
            start_date,
            due_date,
            estimate_hours,
            story_points,
            labels,
            list_id,
            parent_task_id
        } = req.body;

        // ========================================================================
        // VALIDATION STEP 1: Required Fields
        // ========================================================================
        // WHY: Fail fast before hitting the database
        // This saves DB resources and provides immediate feedback
        
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required and must be a non-empty string',
                field: 'title'
            });
        }

        // WHY return early? It stops execution immediately
        // Without return, code would continue and send multiple responses (error!)

        // ========================================================================
        // VALIDATION STEP 2: Project Existence & Get Organization
        // ========================================================================
        // WHY: We need to verify:
        // 1. The project exists (foreign key constraint would fail otherwise)
        // 2. Get the org_id (required for tasks table)
        // 3. Ensure project isn't archived (business logic)
        
        const projectQuery = `
            SELECT id, org_id, name 
            FROM project.projects 
            WHERE id = $1 AND archived_at IS NULL
        `;
        
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or has been archived',
                projectId
            });
        }

        const project = projectResult.rows[0];
        const orgId = project.org_id;

        // ========================================================================
        // VALIDATION STEP 3: Optional Field Validation
        // ========================================================================
        // WHY: Validate ENUM types before database insert
        // PostgreSQL will reject invalid ENUMs, but we want better error messages
        
        // NOTE: These match the PostgreSQL ENUM types defined in schema:
        // CREATE TYPE project.task_state AS ENUM ('new','in_progress','blocked','done');
        // CREATE TYPE project.task_priority AS ENUM ('low','medium','high','urgent');
        const validStates = ['new', 'in_progress', 'blocked', 'done'];
        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        if (state && !validStates.includes(state)) {
            return res.status(400).json({
                success: false,
                message: `Invalid state. Must be one of: ${validStates.join(', ')}`,
                field: 'state',
                validValues: validStates
            });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                field: 'priority',
                validValues: validPriorities
            });
        }

        // Date validation (start_date should be before due_date)
        if (start_date && due_date) {
            const startDateObj = new Date(start_date);
            const dueDateObj = new Date(due_date);
            
            if (startDateObj > dueDateObj) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be after due date',
                    fields: ['start_date', 'due_date']
                });
            }
        }

        // ========================================================================
        // VALIDATION STEP 4: Optional Foreign Keys
        // ========================================================================
        // WHY: If user provided list_id or parent_task_id, verify they exist
        // This gives better error messages than letting DB constraint fail
        
        if (list_id) {
            const listCheck = await pool.query(
                'SELECT id FROM project.task_lists WHERE id = $1 AND org_id = $2',
                [list_id, orgId]
            );
            
            if (listCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Task list not found or does not belong to this organization',
                    field: 'list_id'
                });
            }
        }

        if (parent_task_id) {
            const parentCheck = await pool.query(
                'SELECT id FROM project.tasks WHERE id = $1 AND project_id = $2',
                [parent_task_id, projectId]
            );
            
            if (parentCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent task not found or does not belong to this project',
                    field: 'parent_task_id'
                });
            }
        }

        // ========================================================================
        // DATABASE INSERT
        // ========================================================================
        // WHY this query structure:
        // 1. COALESCE(value, default) → Use provided value OR default
        // 2. RETURNING * → Get full record back (includes auto-generated fields)
        // 3. Parameterized ($1, $2) → Prevents SQL injection attacks
        
        const insertQuery = `
            INSERT INTO project.tasks (
                org_id,
                project_id,
                list_id,
                parent_task_id,
                title,
                description,
                state,
                priority,
                start_date,
                due_date,
                estimate_hours,
                story_points,
                labels,
                position
            ) VALUES (
                $1,   -- org_id (from project lookup)
                $2,   -- project_id (from URL)
                $3,   -- list_id (optional)
                $4,   -- parent_task_id (optional)
                $5,   -- title (required, from body)
                $6,   -- description (optional)
                COALESCE($7::project.task_state, 'new'),     -- state (default: 'new') - CAST to ENUM type
                COALESCE($8::project.task_priority, 'medium'),  -- priority (default: 'medium') - CAST to ENUM type
                $9,   -- start_date (optional)
                $10,  -- due_date (optional)
                COALESCE($11, 0),        -- estimate_hours (default: 0)
                $12,  -- story_points (optional)
                COALESCE($13::text[], '{}'),     -- labels (default: empty array) - CAST to text array
                (SELECT COALESCE(MAX(position), 0) + 1 
                 FROM project.tasks 
                 WHERE project_id = $2 AND list_id IS NOT DISTINCT FROM $3)
                -- ☝️ Smart position: gets next position in the list/project
            )
            RETURNING *
        `;

        // WHY use array for values? Makes code cleaner and safer
        const values = [
            orgId,              // $1
            projectId,          // $2
            list_id || null,    // $3
            parent_task_id || null,  // $4
            title.trim(),       // $5 - always trim user input!
            description || null,// $6
            state || null,      // $7
            priority || null,   // $8
            start_date || null, // $9
            due_date || null,   // $10
            estimate_hours || null,  // $11
            story_points || null,    // $12
            labels || null      // $13
        ];

        const result = await pool.query(insertQuery, values);
        const newTask = result.rows[0];

        // ========================================================================
        // SUCCESS RESPONSE
        // ========================================================================
        // WHY return this structure:
        // - success: boolean → Easy to check on frontend
        // - message: string → User-friendly confirmation
        // - data: object → The created task (with generated ID, timestamps, etc.)
        
        res.status(201).json({  // 201 = Created (not 200 OK)
            success: true,
            message: 'Task created successfully',
            data: {
                id: newTask.id,
                projectId: newTask.project_id,
                projectName: project.name,
                listId: newTask.list_id,
                parentTaskId: newTask.parent_task_id,
                title: newTask.title,
                description: newTask.description,
                state: newTask.state,
                priority: newTask.priority,
                startDate: newTask.start_date,
                dueDate: newTask.due_date,
                estimateHours: newTask.estimate_hours,
                storyPoints: newTask.story_points,
                labels: newTask.labels,
                position: newTask.position,
                createdAt: newTask.created_at,
                updatedAt: newTask.updated_at
            }
        });

    } catch (error) {
        // ========================================================================
        // ERROR HANDLING
        // ========================================================================
        // WHY comprehensive error handling:
        // 1. Log full error server-side (for debugging)
        // 2. Return sanitized error client-side (don't expose internals)
        // 3. Handle specific PostgreSQL errors with helpful messages
        
        console.error('Error creating task:', error);

        // Handle specific PostgreSQL constraint violations
        if (error.code === '23503') {
            // Foreign key violation (e.g., invalid project_id, org_id)
            return res.status(400).json({
                success: false,
                message: 'Invalid reference: One or more IDs do not exist',
                error: error.detail
            });
        }

        if (error.code === '23505') {
            // Unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'A task with these properties already exists',
                error: error.detail
            });
        }

        if (error.code === '22P02') {
            // Invalid UUID format
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format. Must be a valid UUID',
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message
        });
    }
});

// ============================================================================
// GET /api/projects/:id/tasks - Get all tasks for a project
// ============================================================================
/**
 * BONUS ENDPOINT: Retrieve all tasks
 * WHY: You'll need this to display tasks on the frontend
 */
// ============================================================================
// GET /api/projects/:id/tasks - Get all tasks for a project
// Query Parameters:
//   - user_id: Filter tasks assigned to specific user (employee view)
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const projectId = req.params.id;
        const { user_id } = req.query;

        // Check if project exists
        const projectCheck = await pool.query(
            'SELECT id FROM project.projects WHERE id = $1 AND archived_at IS NULL',
            [projectId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        let query, queryParams;
        
        if (user_id) {
            // Employee view: Get only tasks assigned to this user
            query = `
                SELECT DISTINCT
                    t.*,
                    tl.name as list_name,
                    COUNT(DISTINCT ta.user_id) as assignee_count,
                    (SELECT title FROM project.tasks pt WHERE pt.id = t.parent_task_id) as parent_task_title
                FROM project.tasks t
                LEFT JOIN project.task_lists tl ON t.list_id = tl.id
                LEFT JOIN project.task_assignees ta ON t.id = ta.task_id
                INNER JOIN project.task_assignees ta_filter ON t.id = ta_filter.task_id
                WHERE t.project_id = $1 
                  AND ta_filter.user_id = $2
                GROUP BY t.id, tl.name
                ORDER BY t.position ASC, t.created_at DESC
            `;
            queryParams = [projectId, user_id];
        } else {
            // Manager view: Get all tasks
            query = `
                SELECT 
                    t.*,
                    tl.name as list_name,
                    COUNT(DISTINCT ta.user_id) as assignee_count,
                    (SELECT title FROM project.tasks pt WHERE pt.id = t.parent_task_id) as parent_task_title
                FROM project.tasks t
                LEFT JOIN project.task_lists tl ON t.list_id = tl.id
                LEFT JOIN project.task_assignees ta ON t.id = ta.task_id
                WHERE t.project_id = $1
                GROUP BY t.id, tl.name
                ORDER BY t.position ASC, t.created_at DESC
            `;
            queryParams = [projectId];
        }

        const result = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message
        });
    }
});

// ============================================================================
// PUT /api/projects/:id/tasks/:taskId - Update a task
// ============================================================================
router.put('/:taskId', async (req, res) => {
    try {
        const projectId = req.params.id;
        const taskId = req.params.taskId;
        const {
            title,
            description,
            state,
            priority,
            start_date,
            due_date,
            estimate_hours,
            story_points,
            labels,
            list_id,
            parent_task_id,
            position
        } = req.body;

        // Check if task exists and belongs to project
        const taskCheck = await pool.query(
            'SELECT id, project_id FROM project.tasks WHERE id = $1 AND project_id = $2',
            [taskId, projectId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found in this project'
            });
        }

        // Validate state if provided
        const validStates = ['new', 'in_progress', 'blocked', 'done'];
        if (state && !validStates.includes(state)) {
            return res.status(400).json({
                success: false,
                message: `Invalid state. Must be one of: ${validStates.join(', ')}`,
                field: 'state'
            });
        }

        // Validate priority if provided
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                field: 'priority'
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const values = [taskId, projectId];
        let paramCount = 2;

        if (title !== undefined) {
            paramCount++;
            updateFields.push(`title = $${paramCount}`);
            values.push(title.trim());
        }
        if (description !== undefined) {
            paramCount++;
            updateFields.push(`description = $${paramCount}`);
            values.push(description);
        }
        if (state !== undefined) {
            paramCount++;
            updateFields.push(`state = $${paramCount}::project.task_state`);
            values.push(state);
        }
        if (priority !== undefined) {
            paramCount++;
            updateFields.push(`priority = $${paramCount}::project.task_priority`);
            values.push(priority);
        }
        if (start_date !== undefined) {
            paramCount++;
            updateFields.push(`start_date = $${paramCount}`);
            values.push(start_date);
        }
        if (due_date !== undefined) {
            paramCount++;
            updateFields.push(`due_date = $${paramCount}`);
            values.push(due_date);
        }
        if (estimate_hours !== undefined) {
            paramCount++;
            updateFields.push(`estimate_hours = $${paramCount}`);
            values.push(estimate_hours);
        }
        if (story_points !== undefined) {
            paramCount++;
            updateFields.push(`story_points = $${paramCount}`);
            values.push(story_points);
        }
        if (labels !== undefined) {
            paramCount++;
            updateFields.push(`labels = $${paramCount}::text[]`);
            values.push(labels);
        }
        if (list_id !== undefined) {
            paramCount++;
            updateFields.push(`list_id = $${paramCount}`);
            values.push(list_id);
        }
        if (parent_task_id !== undefined) {
            paramCount++;
            updateFields.push(`parent_task_id = $${paramCount}`);
            values.push(parent_task_id);
        }
        if (position !== undefined) {
            paramCount++;
            updateFields.push(`position = $${paramCount}`);
            values.push(position);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at
        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        const updateQuery = `
            UPDATE project.tasks
            SET ${updateFields.join(', ')}
            WHERE id = $1 AND project_id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, values);
        const updatedTask = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });

    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message
        });
    }
});

// ============================================================================
// DELETE /api/projects/:id/tasks/:taskId - Delete a task
// ============================================================================
router.delete('/:taskId', async (req, res) => {
    try {
        const projectId = req.params.id;
        const taskId = req.params.taskId;

        // Check if task exists and belongs to project
        const taskCheck = await pool.query(
            'SELECT id FROM project.tasks WHERE id = $1 AND project_id = $2',
            [taskId, projectId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found in this project'
            });
        }

        // Delete the task
        await pool.query(
            'DELETE FROM project.tasks WHERE id = $1 AND project_id = $2',
            [taskId, projectId]
        );

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task',
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message
        });
    }
});

// ============================================================================
// GET /api/projects/:id/tasks/:taskId - Get a single task
// ============================================================================
router.get('/:taskId', async (req, res) => {
    try {
        const projectId = req.params.id;
        const taskId = req.params.taskId;

        const query = `
            SELECT 
                t.*,
                tl.name as list_name,
                (SELECT title FROM project.tasks pt WHERE pt.id = t.parent_task_id) as parent_task_title
            FROM project.tasks t
            LEFT JOIN project.task_lists tl ON t.list_id = tl.id
            WHERE t.id = $1 AND t.project_id = $2
        `;

        const result = await pool.query(query, [taskId, projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task',
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message
        });
    }
});

module.exports = router;

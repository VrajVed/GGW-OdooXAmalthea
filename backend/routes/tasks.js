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
router.get('/', async (req, res) => {
    try {
        const projectId = req.params.id;

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

        // Fetch all tasks with assignees and metadata
        const query = `
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

        const result = await pool.query(query, [projectId]);

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

module.exports = router;

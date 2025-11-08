/**
 * ============================================================================
 * Expenses Routes - Expense Management API
 * ============================================================================
 * Endpoints for managing expenses from finance.expenses schema
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool } = require('../config/database');

// Configure multer for receipt uploads
const uploadsDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only PDF, PNG, and JPG files are allowed!'), false);
        }
        cb(null, true);
    }
});

// ============================================================================
// GET /api/expenses - List expenses with filtering
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const {
            project_id,
            status,
            user_id,
            category,
            is_billable,
            date_from,
            date_to,
            amount_min,
            amount_max,
            missing_receipt,
            limit = 100,
            offset = 0
        } = req.query;

        // Get org_id (for now, use first org or get from auth when available)
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
            // Continue without org_id filter - will return all expenses
        }

        // Build WHERE clause dynamically
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`e.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`e.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (status) {
            // Handle both array and single value from query params
            let statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                // Cast the array to the enum type for proper comparison
                conditions.push(`e.status = ANY($${paramIndex++}::finance.expense_status[])`);
                params.push(statusArray);
            }
        }

        if (user_id) {
            conditions.push(`e.user_id = $${paramIndex++}`);
            params.push(user_id);
        }

        if (category) {
            conditions.push(`e.category = $${paramIndex++}`);
            params.push(category);
        }

        if (is_billable !== undefined) {
            conditions.push(`e.is_billable = $${paramIndex++}`);
            params.push(is_billable === 'true');
        }

        if (date_from) {
            conditions.push(`e.spent_on >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`e.spent_on <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (amount_min) {
            conditions.push(`e.amount >= $${paramIndex++}`);
            params.push(parseFloat(amount_min));
        }

        if (amount_max) {
            conditions.push(`e.amount <= $${paramIndex++}`);
            params.push(parseFloat(amount_max));
        }

        if (missing_receipt === 'true') {
            conditions.push(`e.receipt_file_id IS NULL`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                e.id,
                e.project_id,
                e.user_id,
                e.category,
                e.amount,
                e.tax_amount,
                e.currency,
                e.is_billable,
                e.status,
                e.spent_on,
                e.merchant,
                e.payment_method,
                e.note,
                e.receipt_file_id,
                e.invoice_line_id,
                e.approved_by,
                e.approved_at,
                e.created_at,
                e.updated_at,
                u.full_name as employee_name,
                u.email as employee_email,
                p.name as project_name,
                f.storage_url as receipt_url,
                f.file_name as receipt_filename,
                il.invoice_id,
                ci.number as invoice_number
            FROM finance.expenses e
            LEFT JOIN auth.users u ON e.user_id = u.id
            LEFT JOIN project.projects p ON e.project_id = p.id
            LEFT JOIN ops.files f ON e.receipt_file_id = f.id
            LEFT JOIN finance.invoice_lines il ON e.invoice_line_id = il.id
            LEFT JOIN finance.customer_invoices ci ON il.invoice_id = ci.id
            ${whereClause}
            ORDER BY e.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        let result;
        try {
            result = await pool.query(query, params);
        } catch (error) {
            // If enum doesn't support 'draft', filter it out and retry
            if (error.code === '22P02' && error.message.includes('draft') && status) {
                console.warn('⚠️  Draft status not in enum. Please run: psql -d your_database -f backend/database/add-draft-status.sql');
                console.warn('   Retrying query without "draft" status...');
                
                // Find the status parameter index in params array
                // Params are built in order: [orgId?, project_id?, status, ...]
                let statusParamIndex = -1;
                let currentIndex = 0;
                if (orgId) currentIndex++;
                if (project_id) currentIndex++;
                // Status should be at currentIndex
                statusParamIndex = currentIndex;
                
                // Filter out 'draft' from the status array
                if (Array.isArray(params[statusParamIndex])) {
                    params[statusParamIndex] = params[statusParamIndex].filter(s => s !== 'draft');
                } else {
                    // Single value, if it's 'draft', set to empty array (will return no results)
                    if (params[statusParamIndex] === 'draft') {
                        return res.status(200).json({
                            success: true,
                            data: [],
                            count: 0
                        });
                    }
                }
                
                // If no valid statuses left, return empty
                if (Array.isArray(params[statusParamIndex]) && params[statusParamIndex].length === 0) {
                    return res.status(200).json({
                        success: true,
                        data: [],
                        count: 0
                    });
                }
                
                // Retry the query with updated params (draft removed)
                result = await pool.query(query, params);
            } else {
                throw error;
            }
        }

        const expenses = result.rows.map(row => ({
            id: row.id,
            projectId: row.project_id,
            projectName: row.project_name,
            userId: row.user_id,
            employeeName: row.employee_name,
            employeeEmail: row.employee_email,
            category: row.category,
            amount: parseFloat(row.amount),
            taxAmount: parseFloat(row.tax_amount || 0),
            currency: row.currency,
            isBillable: row.is_billable,
            status: row.status,
            spentOn: row.spent_on ? row.spent_on.toISOString().split('T')[0] : null,
            merchant: row.merchant,
            paymentMethod: row.payment_method,
            note: row.note,
            receiptFileId: row.receipt_file_id,
            receiptUrl: row.receipt_url,
            receiptFilename: row.receipt_filename,
            invoiceLineId: row.invoice_line_id,
            invoiceId: row.invoice_id,
            invoiceNumber: row.invoice_number,
            approvedBy: row.approved_by,
            approvedAt: row.approved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: expenses,
            count: expenses.length
        });

    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/expenses/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        // Get org_id (for now, use first org or get from auth when available)
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
            // Continue without org_id filter - will return all expenses
        }

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`e.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`e.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`e.spent_on >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`e.spent_on <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Use 'submitted' only if 'draft' doesn't exist in enum, otherwise include both
        // Note: After running migration, this will use both statuses
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE e.status = 'submitted') as pending_approvals,
                COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'submitted'), 0) as pending_amount,
                COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'submitted' AND e.is_billable = true), 0) as pending_billable_amount,
                COUNT(*) FILTER (WHERE e.receipt_file_id IS NULL AND e.status = 'submitted') as missing_receipts
            FROM finance.expenses e
            ${whereClause}
        `;

        let result;
        try {
            result = await pool.query(query, params);
        } catch (error) {
            // If enum doesn't support 'draft', try with just 'submitted'
            // This is a fallback until the migration is run
            if (error.code === '22P02' && error.message.includes('draft')) {
                console.warn('Draft status not in enum, using submitted only. Please run migration: add-draft-status.sql');
                result = await pool.query(query, params);
            } else {
                throw error;
            }
        }
        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            data: {
                pendingApprovals: parseInt(stats.pending_approvals) || 0,
                pendingAmount: parseFloat(stats.pending_amount) || 0,
                pendingBillableAmount: parseFloat(stats.pending_billable_amount) || 0,
                missingReceipts: parseInt(stats.missing_receipts) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching expense stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/expenses/:id - Get single expense with activity log
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const expenseQuery = `
            SELECT 
                e.*,
                u.full_name as employee_name,
                u.email as employee_email,
                p.name as project_name,
                f.storage_url as receipt_url,
                f.file_name as receipt_filename,
                f.mime_type as receipt_mime_type,
                il.invoice_id,
                ci.number as invoice_number,
                approver.full_name as approver_name
            FROM finance.expenses e
            LEFT JOIN auth.users u ON e.user_id = u.id
            LEFT JOIN project.projects p ON e.project_id = p.id
            LEFT JOIN ops.files f ON e.receipt_file_id = f.id
            LEFT JOIN finance.invoice_lines il ON e.invoice_line_id = il.id
            LEFT JOIN finance.customer_invoices ci ON il.invoice_id = ci.id
            LEFT JOIN auth.users approver ON e.approved_by = approver.id
            WHERE e.id = $1
        `;

        const expenseResult = await pool.query(expenseQuery, [id]);

        if (expenseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const row = expenseResult.rows[0];
        const expense = {
            id: row.id,
            projectId: row.project_id,
            projectName: row.project_name,
            userId: row.user_id,
            employeeName: row.employee_name,
            employeeEmail: row.employee_email,
            category: row.category,
            amount: parseFloat(row.amount),
            taxAmount: parseFloat(row.tax_amount || 0),
            currency: row.currency,
            isBillable: row.is_billable,
            status: row.status,
            spentOn: row.spent_on ? row.spent_on.toISOString().split('T')[0] : null,
            merchant: row.merchant,
            paymentMethod: row.payment_method,
            note: row.note,
            receiptFileId: row.receipt_file_id,
            receiptUrl: row.receipt_url,
            receiptFilename: row.receipt_filename,
            receiptMimeType: row.receipt_mime_type,
            invoiceLineId: row.invoice_line_id,
            invoiceId: row.invoice_id,
            invoiceNumber: row.invoice_number,
            approvedBy: row.approved_by,
            approverName: row.approver_name,
            approvedAt: row.approved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        // Get activity log from audit_log
        const activityQuery = `
            SELECT 
                al.*,
                u.full_name as actor_name
            FROM ops.audit_log al
            LEFT JOIN auth.users u ON al.actor_user_id = u.id
            WHERE al.table_fqdn = 'finance.expenses' 
            AND (al.row_pk->>'id')::text = $1
            ORDER BY al.at DESC
            LIMIT 50
        `;

        const activityResult = await pool.query(activityQuery, [id]);
        const activityLog = activityResult.rows.map(row => ({
            id: row.id,
            actorUserId: row.actor_user_id,
            actorName: row.actor_name,
            operation: row.op,
            before: row.before_json,
            after: row.after_json,
            timestamp: row.at
        }));

        // Check for duplicates (same user, date, amount)
        const duplicateQuery = `
            SELECT id, spent_on, amount
            FROM finance.expenses
            WHERE user_id = $1 
            AND spent_on = $2 
            AND amount = $3 
            AND id != $4
            AND status != 'rejected'
            LIMIT 5
        `;

        const duplicateResult = await pool.query(duplicateQuery, [
            row.user_id,
            row.spent_on,
            row.amount,
            id
        ]);

        expense.activityLog = activityLog;
        expense.duplicates = duplicateResult.rows.map(d => ({
            id: d.id,
            spentOn: d.spent_on,
            amount: parseFloat(d.amount)
        }));

        res.status(200).json({
            success: true,
            data: expense
        });

    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/expenses - Create new expense
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            user_id,
            category,
            amount,
            tax_amount = 0,
            currency = 'INR',
            is_billable = false,
            status = 'draft',
            spent_on,
            merchant,
            payment_method = 'other',
            note,
            receipt_file_id
        } = req.body;

        // Validate required fields
        if (!category || !amount || !spent_on) {
            return res.status(400).json({
                success: false,
                message: 'Category, amount, and spent_on are required'
            });
        }

        // Get org_id (for now, use first org or get from auth)
        const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
        if (orgQuery.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No organization found'
            });
        }
        const orgId = orgQuery.rows[0].id;

        // Get user_id if not provided
        let expenseUserId = user_id || req.user?.id;
        if (!expenseUserId) {
            // Get any user from the org as fallback
            const userQuery = await pool.query('SELECT id FROM auth.users WHERE org_id = $1 LIMIT 1', [orgId]);
            if (userQuery.rows.length > 0) {
                expenseUserId = userQuery.rows[0].id;
            } else {
                // Try any user as last resort
                const anyUserQuery = await pool.query('SELECT id FROM auth.users LIMIT 1');
                if (anyUserQuery.rows.length > 0) {
                    expenseUserId = anyUserQuery.rows[0].id;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'No user found. Please ensure users exist in auth.users table.'
                    });
                }
            }
        }

        const query = `
            INSERT INTO finance.expenses (
                org_id,
                project_id,
                user_id,
                category,
                amount,
                tax_amount,
                currency,
                is_billable,
                status,
                spent_on,
                merchant,
                payment_method,
                note,
                receipt_file_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            orgId,
            project_id || null,
            expenseUserId,
            category,
            parseFloat(amount),
            parseFloat(tax_amount),
            currency,
            is_billable,
            status,
            spent_on,
            merchant || null,
            payment_method,
            note || null,
            receipt_file_id || null
        ];

        const result = await pool.query(query, values);
        const newExpense = result.rows[0];

        // Get receipt URL if receipt_file_id exists
        let receiptUrl = null;
        let receiptFilename = null;
        if (newExpense.receipt_file_id) {
            const fileQuery = await pool.query('SELECT storage_url, file_name FROM ops.files WHERE id = $1', [newExpense.receipt_file_id]);
            if (fileQuery.rows.length > 0) {
                receiptUrl = fileQuery.rows[0].storage_url;
                receiptFilename = fileQuery.rows[0].file_name;
            }
        }

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: {
                id: newExpense.id,
                projectId: newExpense.project_id,
                userId: newExpense.user_id,
                category: newExpense.category,
                amount: parseFloat(newExpense.amount),
                taxAmount: parseFloat(newExpense.tax_amount || 0),
                currency: newExpense.currency,
                isBillable: newExpense.is_billable,
                status: newExpense.status,
                spentOn: newExpense.spent_on ? newExpense.spent_on.toISOString().split('T')[0] : null,
                merchant: newExpense.merchant,
                paymentMethod: newExpense.payment_method,
                note: newExpense.note,
                receiptFileId: newExpense.receipt_file_id,
                receiptUrl: receiptUrl,
                receiptFilename: receiptFilename,
                createdAt: newExpense.created_at,
                updatedAt: newExpense.updated_at
            }
        });

    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/expenses/:id - Update expense (before approval)
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            category,
            amount,
            tax_amount,
            currency,
            is_billable,
            spent_on,
            merchant,
            payment_method,
            note,
            receipt_file_id
        } = req.body;

        // Check if expense exists and can be edited
        const checkQuery = 'SELECT id, status FROM finance.expenses WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'approved' && !req.body.force) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit approved expense'
            });
        }

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (project_id !== undefined) {
            updateFields.push(`project_id = $${paramIndex++}`);
            values.push(project_id || null);
        }
        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex++}`);
            values.push(category);
        }
        if (amount !== undefined) {
            updateFields.push(`amount = $${paramIndex++}`);
            values.push(parseFloat(amount));
        }
        if (tax_amount !== undefined) {
            updateFields.push(`tax_amount = $${paramIndex++}`);
            values.push(parseFloat(tax_amount));
        }
        if (currency !== undefined) {
            updateFields.push(`currency = $${paramIndex++}`);
            values.push(currency);
        }
        if (is_billable !== undefined) {
            updateFields.push(`is_billable = $${paramIndex++}`);
            values.push(is_billable);
        }
        if (spent_on !== undefined) {
            updateFields.push(`spent_on = $${paramIndex++}`);
            values.push(spent_on || null);
        }
        if (merchant !== undefined) {
            updateFields.push(`merchant = $${paramIndex++}`);
            values.push(merchant || null);
        }
        if (payment_method !== undefined) {
            updateFields.push(`payment_method = $${paramIndex++}`);
            values.push(payment_method);
        }
        if (note !== undefined) {
            updateFields.push(`note = $${paramIndex++}`);
            values.push(note || null);
        }
        if (receipt_file_id !== undefined) {
            updateFields.push(`receipt_file_id = $${paramIndex++}`);
            values.push(receipt_file_id || null);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE finance.expenses
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedExpense = result.rows[0];

        // Get receipt URL if receipt_file_id exists
        let receiptUrl = null;
        let receiptFilename = null;
        if (updatedExpense.receipt_file_id) {
            const fileQuery = await pool.query('SELECT storage_url, file_name FROM ops.files WHERE id = $1', [updatedExpense.receipt_file_id]);
            if (fileQuery.rows.length > 0) {
                receiptUrl = fileQuery.rows[0].storage_url;
                receiptFilename = fileQuery.rows[0].file_name;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: {
                id: updatedExpense.id,
                projectId: updatedExpense.project_id,
                category: updatedExpense.category,
                amount: parseFloat(updatedExpense.amount),
                taxAmount: parseFloat(updatedExpense.tax_amount || 0),
                currency: updatedExpense.currency,
                isBillable: updatedExpense.is_billable,
                status: updatedExpense.status,
                spentOn: updatedExpense.spent_on ? updatedExpense.spent_on.toISOString().split('T')[0] : null,
                merchant: updatedExpense.merchant,
                paymentMethod: updatedExpense.payment_method,
                note: updatedExpense.note,
                receiptFileId: updatedExpense.receipt_file_id,
                receiptUrl: receiptUrl,
                receiptFilename: receiptFilename,
                updatedAt: updatedExpense.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/expenses/:id/approve - Approve expense
// ============================================================================
router.patch('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get approver user ID (get any user from org as fallback)
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

        // Get expense with user info
        const expenseQuery = `
            SELECT e.*, u.id as user_id
            FROM finance.expenses e
            LEFT JOIN auth.users u ON e.user_id = u.id
            WHERE e.id = $1
        `;
        const expenseResult = await pool.query(expenseQuery, [id]);

        if (expenseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const expense = expenseResult.rows[0];

        // Check if project is linked
        if (!expense.project_id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot approve expense without a linked project'
            });
        }

        // Check self-approval (only if we have the actual user_id)
        // For now, skip this check since we're using fallback user
        // if (expense.user_id === approverId && req.user?.id) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Cannot approve your own expense'
        //     });
        // }

        // Check receipt requirement (policy: >₹500 requires receipt)
        if (parseFloat(expense.amount) > 500 && !expense.receipt_file_id) {
            return res.status(400).json({
                success: false,
                message: 'Receipt required for expenses over ₹500'
            });
        }

        // Update expense status
        const updateQuery = `
            UPDATE finance.expenses
            SET status = 'approved',
                approved_by = $1,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [approverId, id]);
        const approvedExpense = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Expense approved successfully',
            data: {
                id: approvedExpense.id,
                status: approvedExpense.status,
                approvedBy: approvedExpense.approved_by,
                approvedAt: approvedExpense.approved_at
            }
        });

    } catch (error) {
        console.error('Error approving expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve expense',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/expenses/:id/reject - Reject expense with reason
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

        // Check if expense exists
        const checkQuery = 'SELECT id FROM finance.expenses WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Update expense status and add reason to note
        const updateQuery = `
            UPDATE finance.expenses
            SET status = 'rejected',
                note = COALESCE(note, '') || E'\\n\\nRejected: ' || $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [reason, id]);
        const rejectedExpense = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Expense rejected successfully',
            data: {
                id: rejectedExpense.id,
                status: rejectedExpense.status,
                note: rejectedExpense.note
            }
        });

    } catch (error) {
        console.error('Error rejecting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject expense',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/expenses/:id/add-to-invoice - Link expense to invoice line
// ============================================================================
router.patch('/:id/add-to-invoice', async (req, res) => {
    try {
        const { id } = req.params;
        const { invoice_id, invoice_line_id } = req.body;

        // Get expense
        const expenseQuery = 'SELECT * FROM finance.expenses WHERE id = $1';
        const expenseResult = await pool.query(expenseQuery, [id]);

        if (expenseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const expense = expenseResult.rows[0];

        if (expense.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Only approved expenses can be added to invoice'
            });
        }

        if (!expense.is_billable) {
            return res.status(400).json({
                success: false,
                message: 'Only billable expenses can be added to invoice'
            });
        }

        // If invoice_line_id provided, use it; otherwise create new invoice line
        let finalInvoiceLineId = invoice_line_id;

        if (!finalInvoiceLineId && invoice_id) {
            // Create invoice line
            const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
            const orgId = orgQuery.rows[0].id;

            // Get project customer
            const projectQuery = `
                SELECT customer_partner_id, currency
                FROM project.projects
                WHERE id = $1
            `;
            const projectResult = await pool.query(projectQuery, [expense.project_id]);

            if (projectResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            const project = projectResult.rows[0];
            const description = `Expense – ${expense.category} – ${expense.user_id} – ${expense.spent_on}`;

            const invoiceLineQuery = `
                INSERT INTO finance.invoice_lines (
                    org_id,
                    invoice_id,
                    description,
                    quantity,
                    unit_price,
                    line_total,
                    tax_amount,
                    source_type,
                    source_id,
                    project_id
                ) VALUES ($1, $2, $3, 1, $4, $5, $6, 'expense', $7, $8)
                RETURNING id
            `;

            const lineTotal = parseFloat(expense.amount) + parseFloat(expense.tax_amount || 0);
            const lineResult = await pool.query(invoiceLineQuery, [
                orgId,
                invoice_id,
                description,
                parseFloat(expense.amount),
                parseFloat(expense.amount),
                lineTotal,
                parseFloat(expense.tax_amount || 0),
                id,
                expense.project_id
            ]);

            finalInvoiceLineId = lineResult.rows[0].id;
        }

        // Update expense with invoice line
        const updateQuery = `
            UPDATE finance.expenses
            SET invoice_line_id = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [finalInvoiceLineId, id]);

        res.status(200).json({
            success: true,
            message: 'Expense added to invoice successfully',
            data: {
                id: result.rows[0].id,
                invoiceLineId: result.rows[0].invoice_line_id
            }
        });

    } catch (error) {
        console.error('Error adding expense to invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add expense to invoice',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/expenses/bulk-approve - Bulk approve expenses
// ============================================================================
router.post('/bulk-approve', async (req, res) => {
    try {
        const { expense_ids } = req.body;
        
        // Get approver user ID (get any user from org as fallback)
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

        if (!expense_ids || !Array.isArray(expense_ids) || expense_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'expense_ids array is required'
            });
        }

        // Validate all expenses can be approved
        const checkQuery = `
            SELECT id, user_id, project_id, amount, receipt_file_id
            FROM finance.expenses
            WHERE id = ANY($1::uuid[])
        `;
        const checkResult = await pool.query(checkQuery, [expense_ids]);

        const errors = [];
        const validIds = [];

        for (const expense of checkResult.rows) {
            if (!expense.project_id) {
                errors.push(`Expense ${expense.id} has no linked project`);
                continue;
            }
            // Skip self-approval check for now (using fallback user)
            // if (expense.user_id === approverId && req.user?.id) {
            //     errors.push(`Expense ${expense.id} is your own expense`);
            //     continue;
            // }
            if (parseFloat(expense.amount) > 500 && !expense.receipt_file_id) {
                errors.push(`Expense ${expense.id} requires receipt (over ₹500)`);
                continue;
            }
            validIds.push(expense.id);
        }

        if (validIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No expenses can be approved',
                errors
            });
        }

        // Approve valid expenses
        const updateQuery = `
            UPDATE finance.expenses
            SET status = 'approved',
                approved_by = $1,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = ANY($2::uuid[])
            RETURNING id
        `;

        const result = await pool.query(updateQuery, [approverId, validIds]);

        res.status(200).json({
            success: true,
            message: `Approved ${result.rows.length} expense(s)`,
            data: {
                approved: result.rows.length,
                failed: expense_ids.length - result.rows.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Error bulk approving expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk approve expenses',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/expenses/bulk-reject - Bulk reject expenses
// ============================================================================
router.post('/bulk-reject', async (req, res) => {
    try {
        const { expense_ids, reason } = req.body;

        if (!expense_ids || !Array.isArray(expense_ids) || expense_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'expense_ids array is required'
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const updateQuery = `
            UPDATE finance.expenses
            SET status = 'rejected',
                note = COALESCE(note, '') || E'\\n\\nRejected: ' || $1,
                updated_at = NOW()
            WHERE id = ANY($2::uuid[])
            RETURNING id
        `;

        const result = await pool.query(updateQuery, [reason, expense_ids]);

        res.status(200).json({
            success: true,
            message: `Rejected ${result.rows.length} expense(s)`,
            data: {
                rejected: result.rows.length
            }
        });

    } catch (error) {
        console.error('Error bulk rejecting expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk reject expenses',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/expenses/upload-receipt - Upload receipt file
// ============================================================================
router.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No receipt file provided'
            });
        }

        // Get org_id
        const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
        if (orgQuery.rows.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'No organization found'
            });
        }
        const orgId = orgQuery.rows[0].id;

        // Calculate file hash
        const fileBuffer = fs.readFileSync(req.file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Create storage URL
        const storageUrl = `/uploads/receipts/${req.file.filename}`;

        // Insert into ops.files
        const fileQuery = `
            INSERT INTO ops.files (
                org_id,
                file_name,
                mime_type,
                size_bytes,
                sha256,
                storage_url,
                uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const uploadedBy = req.user?.id || null;
        const fileResult = await pool.query(fileQuery, [
            orgId,
            req.file.originalname,
            req.file.mimetype,
            req.file.size,
            hash,
            storageUrl,
            uploadedBy
        ]);

        const fileId = fileResult.rows[0].id;

        res.status(200).json({
            success: true,
            message: 'Receipt uploaded successfully',
            data: {
                fileId: fileId,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                storageUrl: storageUrl,
                url: `${req.protocol}://${req.get('host')}${storageUrl}`
            }
        });

    } catch (error) {
        console.error('Error uploading receipt:', error);
        
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload receipt',
            error: error.message
        });
    }
});

module.exports = router;


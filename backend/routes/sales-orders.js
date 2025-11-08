/**
 * ============================================================================
 * Sales Orders Routes - Sales Order Management API
 * ============================================================================
 * Endpoints for managing sales orders from finance.sales_orders schema
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper function to get org_id
async function getOrgId(req) {
    let orgId = null;
    try {
        if (req.user?.id) {
            const orgQuery = await pool.query('SELECT org_id FROM auth.users WHERE id = $1 LIMIT 1', [req.user.id]);
            if (orgQuery.rows.length > 0) {
                orgId = orgQuery.rows[0].org_id;
            }
        }
        if (!orgId) {
            // Try to get GGW Organization first, otherwise get first org
            let orgQuery = await pool.query("SELECT id FROM auth.orgs WHERE name = 'GGW Organization' LIMIT 1");
            if (orgQuery.rows.length > 0) {
                orgId = orgQuery.rows[0].id;
            } else {
                orgQuery = await pool.query('SELECT id FROM auth.orgs ORDER BY created_at LIMIT 1');
                if (orgQuery.rows.length > 0) {
                    orgId = orgQuery.rows[0].id;
                }
            }
        }
    } catch (orgError) {
        console.warn('Could not determine org_id, proceeding without org filter:', orgError.message);
    }
    return orgId;
}

// Helper function to generate document number
async function generateNumber(orgId, docType = 'SO') {
    try {
        // Get or create sequence
        let seqQuery = await pool.query(
            'SELECT next_val FROM finance.sequences WHERE org_id = $1 AND doc_type = $2',
            [orgId, docType]
        );

        let nextVal;
        if (seqQuery.rows.length === 0) {
            // Create new sequence
            await pool.query(
                'INSERT INTO finance.sequences (org_id, doc_type, prefix, next_val, padding) VALUES ($1, $2, $3, 1, 5)',
                [orgId, docType, docType]
            );
            nextVal = 1;
        } else {
            nextVal = parseInt(seqQuery.rows[0].next_val);
        }

        // Update sequence
        await pool.query(
            'UPDATE finance.sequences SET next_val = next_val + 1 WHERE org_id = $1 AND doc_type = $2',
            [orgId, docType]
        );

        // Format number with padding
        const padding = 5;
        return `${docType}-${String(nextVal).padStart(padding, '0')}`;
    } catch (error) {
        console.error('Error generating number:', error);
        // Fallback to timestamp-based number
        return `${docType}-${Date.now()}`;
    }
}

// ============================================================================
// GET /api/sales-orders - List sales orders with filtering
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const {
            project_id,
            status,
            customer_partner_id,
            date_from,
            date_to,
            amount_min,
            amount_max,
            search,
            limit = 100,
            offset = 0
        } = req.query;

        const orgId = await getOrgId(req);
        console.log('Sales Orders API - orgId:', orgId);
        console.log('Sales Orders API - filters:', req.query);

        // Build WHERE clause dynamically
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`so.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`so.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (status) {
            let statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                conditions.push(`so.status = ANY($${paramIndex++}::finance.order_status[])`);
                params.push(statusArray);
            }
        }

        if (customer_partner_id) {
            conditions.push(`so.customer_partner_id = $${paramIndex++}`);
            params.push(customer_partner_id);
        }

        if (date_from) {
            conditions.push(`so.order_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`so.order_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (amount_min) {
            conditions.push(`so.grand_total >= $${paramIndex++}`);
            params.push(parseFloat(amount_min));
        }

        if (amount_max) {
            conditions.push(`so.grand_total <= $${paramIndex++}`);
            params.push(parseFloat(amount_max));
        }

        if (search) {
            conditions.push(`(
                so.number ILIKE $${paramIndex} OR 
                so.reference ILIKE $${paramIndex} OR
                p.display_name ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                so.id,
                so.number,
                so.project_id,
                so.customer_partner_id,
                so.order_date,
                so.due_date,
                so.currency,
                so.subtotal,
                so.discount_total,
                so.tax_total,
                so.grand_total,
                so.status,
                so.reference,
                so.notes,
                so.posted_at,
                so.cancelled_at,
                so.created_at,
                so.updated_at,
                p.display_name as customer_name,
                p.email as customer_email,
                pr.name as project_name
            FROM finance.sales_orders so
            LEFT JOIN catalog.partners p ON so.customer_partner_id = p.id
            LEFT JOIN project.projects pr ON so.project_id = pr.id
            ${whereClause}
            ORDER BY so.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        console.log('Sales Orders API - Query:', query.replace(/\s+/g, ' ').trim());
        console.log('Sales Orders API - Params:', params);

        const result = await pool.query(query, params);
        console.log('Sales Orders API - Result count:', result.rows.length);

        const salesOrders = result.rows.map(row => ({
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            customerPartnerId: row.customer_partner_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            orderDate: row.order_date ? row.order_date.toISOString().split('T')[0] : null,
            dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
            currency: row.currency,
            subtotal: parseFloat(row.subtotal || 0),
            discountTotal: parseFloat(row.discount_total || 0),
            taxTotal: parseFloat(row.tax_total || 0),
            grandTotal: parseFloat(row.grand_total || 0),
            status: row.status,
            reference: row.reference,
            notes: row.notes,
            postedAt: row.posted_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: salesOrders,
            count: salesOrders.length
        });

    } catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales orders',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/sales-orders/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        const orgId = await getOrgId(req);

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`so.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`so.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`so.order_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`so.order_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE so.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE so.status = 'confirmed') as confirmed_count,
                COUNT(*) FILTER (WHERE so.status = 'fulfilled') as fulfilled_count,
                COALESCE(SUM(so.grand_total), 0) as total_amount,
                COALESCE(SUM(so.grand_total) FILTER (WHERE so.status = 'confirmed'), 0) as confirmed_amount
            FROM finance.sales_orders so
            ${whereClause}
        `;

        const result = await pool.query(query, params);
        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            data: {
                totalCount: parseInt(stats.total_count) || 0,
                draftCount: parseInt(stats.draft_count) || 0,
                confirmedCount: parseInt(stats.confirmed_count) || 0,
                fulfilledCount: parseInt(stats.fulfilled_count) || 0,
                totalAmount: parseFloat(stats.total_amount) || 0,
                confirmedAmount: parseFloat(stats.confirmed_amount) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching sales order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales order stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/sales-orders/:id - Get single sales order with lines
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const orderQuery = `
            SELECT 
                so.*,
                p.display_name as customer_name,
                p.email as customer_email,
                pr.name as project_name
            FROM finance.sales_orders so
            LEFT JOIN catalog.partners p ON so.customer_partner_id = p.id
            LEFT JOIN project.projects pr ON so.project_id = pr.id
            WHERE so.id = $1
        `;

        const orderResult = await pool.query(orderQuery, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        const row = orderResult.rows[0];
        const salesOrder = {
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            customerPartnerId: row.customer_partner_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            orderDate: row.order_date ? row.order_date.toISOString().split('T')[0] : null,
            dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
            paymentTermsId: row.payment_terms_id,
            currency: row.currency,
            fxRate: parseFloat(row.fx_rate || 1),
            subtotal: parseFloat(row.subtotal || 0),
            discountTotal: parseFloat(row.discount_total || 0),
            taxTotal: parseFloat(row.tax_total || 0),
            grandTotal: parseFloat(row.grand_total || 0),
            baseCurrencyTotal: parseFloat(row.base_currency_total || 0),
            status: row.status,
            reference: row.reference,
            notes: row.notes,
            billToSnapshot: row.bill_to_snapshot_json,
            shipToSnapshot: row.ship_to_snapshot_json,
            postedAt: row.posted_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        // Get lines
        const linesQuery = `
            SELECT 
                sol.*,
                prod.name as product_name,
                prod.product_code,
                uom.code as uom_code,
                uom.name as uom_name
            FROM finance.sales_order_lines sol
            LEFT JOIN catalog.products prod ON sol.product_id = prod.id
            LEFT JOIN catalog.uoms uom ON sol.uom_id = uom.id
            WHERE sol.sales_order_id = $1
            ORDER BY sol.id
        `;

        const linesResult = await pool.query(linesQuery, [id]);
        salesOrder.lines = linesResult.rows.map(line => ({
            id: line.id,
            productId: line.product_id,
            productName: line.product_name,
            productCode: line.product_code,
            description: line.description,
            quantity: parseFloat(line.quantity),
            uomId: line.uom_id,
            uomCode: line.uom_code,
            uomName: line.uom_name,
            unitPrice: parseFloat(line.unit_price),
            discountPercent: parseFloat(line.discount_percent || 0),
            discountAmount: parseFloat(line.discount_amount || 0),
            taxAmount: parseFloat(line.tax_amount || 0),
            taxIds: line.tax_ids || [],
            lineTotal: parseFloat(line.line_total),
            milestoneId: line.milestone_id
        }));

        res.status(200).json({
            success: true,
            data: salesOrder
        });

    } catch (error) {
        console.error('Error fetching sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales order',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/sales-orders - Create new sales order
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            customer_partner_id,
            order_date,
            due_date,
            payment_terms_id,
            currency = 'INR',
            fx_rate,
            reference,
            notes,
            lines = []
        } = req.body;

        // Validate required fields
        if (!customer_partner_id) {
            return res.status(400).json({
                success: false,
                message: 'Customer partner is required'
            });
        }

        if (!lines || lines.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one line item is required'
            });
        }

        const orgId = await getOrgId(req);
        if (!orgId) {
            return res.status(400).json({
                success: false,
                message: 'No organization found'
            });
        }

        // Generate number
        const number = await generateNumber(orgId, 'SO');

        // Calculate totals from lines
        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        for (const line of lines) {
            const quantity = parseFloat(line.quantity || 1);
            const unitPrice = parseFloat(line.unit_price || 0);
            const discountPercent = parseFloat(line.discount_percent || 0);
            const discountAmount = (subtotal * discountPercent / 100) + parseFloat(line.discount_amount || 0);
            const taxAmount = parseFloat(line.tax_amount || 0);
            const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

            subtotal += quantity * unitPrice;
            discountTotal += discountAmount;
            taxTotal += taxAmount;
            grandTotal += lineTotal;
        }

        // Insert sales order
        const orderQuery = `
            INSERT INTO finance.sales_orders (
                org_id,
                number,
                project_id,
                customer_partner_id,
                order_date,
                due_date,
                payment_terms_id,
                currency,
                fx_rate,
                subtotal,
                discount_total,
                tax_total,
                grand_total,
                reference,
                notes,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft')
            RETURNING *
        `;

        const orderValues = [
            orgId,
            number,
            project_id || null,
            customer_partner_id,
            order_date || new Date().toISOString().split('T')[0],
            due_date || null,
            payment_terms_id || null,
            currency,
            fx_rate || 1,
            subtotal,
            discountTotal,
            taxTotal,
            grandTotal,
            reference || null,
            notes || null
        ];

        const orderResult = await pool.query(orderQuery, orderValues);
        const salesOrder = orderResult.rows[0];

        // Insert lines
        const lineValues = [];
        for (const line of lines) {
            const quantity = parseFloat(line.quantity || 1);
            const unitPrice = parseFloat(line.unit_price || 0);
            const discountPercent = parseFloat(line.discount_percent || 0);
            const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
            const taxAmount = parseFloat(line.tax_amount || 0);
            const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

            const lineQuery = `
                INSERT INTO finance.sales_order_lines (
                    org_id,
                    sales_order_id,
                    product_id,
                    description,
                    quantity,
                    uom_id,
                    unit_price,
                    discount_percent,
                    discount_amount,
                    tax_amount,
                    tax_ids,
                    line_total,
                    milestone_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            const lineResult = await pool.query(lineQuery, [
                orgId,
                salesOrder.id,
                line.product_id || null,
                line.description || '',
                quantity,
                line.uom_id || null,
                unitPrice,
                discountPercent,
                discountAmount,
                taxAmount,
                line.tax_ids || [],
                lineTotal,
                line.milestone_id || null
            ]);

            lineValues.push(lineResult.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Sales order created successfully',
            data: {
                id: salesOrder.id,
                number: salesOrder.number,
                projectId: salesOrder.project_id,
                customerPartnerId: salesOrder.customer_partner_id,
                orderDate: salesOrder.order_date ? salesOrder.order_date.toISOString().split('T')[0] : null,
                currency: salesOrder.currency,
                subtotal: parseFloat(salesOrder.subtotal),
                discountTotal: parseFloat(salesOrder.discount_total),
                taxTotal: parseFloat(salesOrder.tax_total),
                grandTotal: parseFloat(salesOrder.grand_total),
                status: salesOrder.status,
                lines: lineValues.map(l => ({
                    id: l.id,
                    productId: l.product_id,
                    description: l.description,
                    quantity: parseFloat(l.quantity),
                    unitPrice: parseFloat(l.unit_price),
                    lineTotal: parseFloat(l.line_total)
                })),
                createdAt: salesOrder.created_at
            }
        });

    } catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sales order',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/sales-orders/:id - Update sales order
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            customer_partner_id,
            order_date,
            due_date,
            payment_terms_id,
            currency,
            fx_rate,
            reference,
            notes,
            lines
        } = req.body;

        // Check if order exists and can be edited
        const checkQuery = 'SELECT id, status FROM finance.sales_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'closed' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit ${currentStatus} sales order`
            });
        }

        const orgId = await getOrgId(req);

        // If lines are provided, recalculate totals
        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        if (lines && lines.length > 0) {
            // Delete existing lines
            await pool.query('DELETE FROM finance.sales_order_lines WHERE sales_order_id = $1', [id]);

            // Insert new lines and calculate totals
            for (const line of lines) {
                const quantity = parseFloat(line.quantity || 1);
                const unitPrice = parseFloat(line.unit_price || 0);
                const discountPercent = parseFloat(line.discount_percent || 0);
                const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
                const taxAmount = parseFloat(line.tax_amount || 0);
                const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

                await pool.query(`
                    INSERT INTO finance.sales_order_lines (
                        org_id, sales_order_id, product_id, description, quantity,
                        uom_id, unit_price, discount_percent, discount_amount,
                        tax_amount, tax_ids, line_total, milestone_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    orgId,
                    id,
                    line.product_id || null,
                    line.description || '',
                    quantity,
                    line.uom_id || null,
                    unitPrice,
                    discountPercent,
                    discountAmount,
                    taxAmount,
                    line.tax_ids || [],
                    lineTotal,
                    line.milestone_id || null
                ]);

                subtotal += quantity * unitPrice;
                discountTotal += discountAmount;
                taxTotal += taxAmount;
                grandTotal += lineTotal;
            }
        }

        // Update order header
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (project_id !== undefined) {
            updateFields.push(`project_id = $${paramIndex++}`);
            values.push(project_id || null);
        }
        if (customer_partner_id !== undefined) {
            updateFields.push(`customer_partner_id = $${paramIndex++}`);
            values.push(customer_partner_id);
        }
        if (order_date !== undefined) {
            updateFields.push(`order_date = $${paramIndex++}`);
            values.push(order_date);
        }
        if (due_date !== undefined) {
            updateFields.push(`due_date = $${paramIndex++}`);
            values.push(due_date || null);
        }
        if (payment_terms_id !== undefined) {
            updateFields.push(`payment_terms_id = $${paramIndex++}`);
            values.push(payment_terms_id || null);
        }
        if (currency !== undefined) {
            updateFields.push(`currency = $${paramIndex++}`);
            values.push(currency);
        }
        if (fx_rate !== undefined) {
            updateFields.push(`fx_rate = $${paramIndex++}`);
            values.push(fx_rate);
        }
        if (reference !== undefined) {
            updateFields.push(`reference = $${paramIndex++}`);
            values.push(reference || null);
        }
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex++}`);
            values.push(notes || null);
        }
        if (lines && lines.length > 0) {
            updateFields.push(`subtotal = $${paramIndex++}`);
            values.push(subtotal);
            updateFields.push(`discount_total = $${paramIndex++}`);
            values.push(discountTotal);
            updateFields.push(`tax_total = $${paramIndex++}`);
            values.push(taxTotal);
            updateFields.push(`grand_total = $${paramIndex++}`);
            values.push(grandTotal);
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
            UPDATE finance.sales_orders
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedOrder = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Sales order updated successfully',
            data: {
                id: updatedOrder.id,
                number: updatedOrder.number,
                projectId: updatedOrder.project_id,
                customerPartnerId: updatedOrder.customer_partner_id,
                orderDate: updatedOrder.order_date ? updatedOrder.order_date.toISOString().split('T')[0] : null,
                currency: updatedOrder.currency,
                subtotal: parseFloat(updatedOrder.subtotal),
                discountTotal: parseFloat(updatedOrder.discount_total),
                taxTotal: parseFloat(updatedOrder.tax_total),
                grandTotal: parseFloat(updatedOrder.grand_total),
                status: updatedOrder.status,
                updatedAt: updatedOrder.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sales order',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/sales-orders/:id/confirm - Confirm sales order
// ============================================================================
router.patch('/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.sales_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm sales order with status: ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.sales_orders
            SET status = 'confirmed',
                posted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const confirmedOrder = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Sales order confirmed successfully',
            data: {
                id: confirmedOrder.id,
                status: confirmedOrder.status,
                postedAt: confirmedOrder.posted_at
            }
        });

    } catch (error) {
        console.error('Error confirming sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm sales order',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/sales-orders/:id/cancel - Cancel sales order
// ============================================================================
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.sales_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'closed' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Sales order is already ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.sales_orders
            SET status = 'cancelled',
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const cancelledOrder = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Sales order cancelled successfully',
            data: {
                id: cancelledOrder.id,
                status: cancelledOrder.status,
                cancelledAt: cancelledOrder.cancelled_at
            }
        });

    } catch (error) {
        console.error('Error cancelling sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel sales order',
            error: error.message
        });
    }
});

module.exports = router;


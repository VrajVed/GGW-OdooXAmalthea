/**
 * ============================================================================
 * Purchase Orders Routes - Purchase Order Management API
 * ============================================================================
 * Endpoints for managing purchase orders from finance.purchase_orders schema
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
            if (orgQuery.rows.length === 0) {
                orgQuery = await pool.query('SELECT id FROM auth.orgs ORDER BY created_at LIMIT 1');
            }
            if (orgQuery.rows.length > 0) {
                orgId = orgQuery.rows[0].id;
            }
        }
    } catch (orgError) {
        console.warn('Could not determine org_id, proceeding without org filter:', orgError.message);
    }
    return orgId;
}

// Helper function to generate document number
async function generateNumber(orgId, docType = 'PO') {
    try {
        let seqQuery = await pool.query(
            'SELECT next_val FROM finance.sequences WHERE org_id = $1 AND doc_type = $2',
            [orgId, docType]
        );

        let nextVal;
        if (seqQuery.rows.length === 0) {
            await pool.query(
                'INSERT INTO finance.sequences (org_id, doc_type, prefix, next_val, padding) VALUES ($1, $2, $3, 1, 5)',
                [orgId, docType, docType]
            );
            nextVal = 1;
        } else {
            nextVal = parseInt(seqQuery.rows[0].next_val);
        }

        await pool.query(
            'UPDATE finance.sequences SET next_val = next_val + 1 WHERE org_id = $1 AND doc_type = $2',
            [orgId, docType]
        );

        const padding = 5;
        return `${docType}-${String(nextVal).padStart(padding, '0')}`;
    } catch (error) {
        console.error('Error generating number:', error);
        return `${docType}-${Date.now()}`;
    }
}

// ============================================================================
// GET /api/purchase-orders - List purchase orders with filtering
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const {
            project_id,
            status,
            vendor_partner_id,
            date_from,
            date_to,
            amount_min,
            amount_max,
            search,
            limit = 100,
            offset = 0
        } = req.query;

        const orgId = await getOrgId(req);

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`po.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`po.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (status) {
            let statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                conditions.push(`po.status = ANY($${paramIndex++}::finance.order_status[])`);
                params.push(statusArray);
            }
        }

        if (vendor_partner_id) {
            conditions.push(`po.vendor_partner_id = $${paramIndex++}`);
            params.push(vendor_partner_id);
        }

        if (date_from) {
            conditions.push(`po.order_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`po.order_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (amount_min) {
            conditions.push(`po.grand_total >= $${paramIndex++}`);
            params.push(parseFloat(amount_min));
        }

        if (amount_max) {
            conditions.push(`po.grand_total <= $${paramIndex++}`);
            params.push(parseFloat(amount_max));
        }

        if (search) {
            conditions.push(`(
                po.number ILIKE $${paramIndex} OR 
                po.reference ILIKE $${paramIndex} OR
                p.display_name ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                po.id,
                po.number,
                po.project_id,
                po.vendor_partner_id,
                po.order_date,
                po.expected_delivery_date,
                po.due_date,
                po.currency,
                po.subtotal,
                po.discount_total,
                po.tax_total,
                po.grand_total,
                po.status,
                po.reference,
                po.notes,
                po.posted_at,
                po.cancelled_at,
                po.created_at,
                po.updated_at,
                p.display_name as vendor_name,
                p.email as vendor_email,
                pr.name as project_name
            FROM finance.purchase_orders po
            LEFT JOIN catalog.partners p ON po.vendor_partner_id = p.id
            LEFT JOIN project.projects pr ON po.project_id = pr.id
            ${whereClause}
            ORDER BY po.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        const result = await pool.query(query, params);

        const purchaseOrders = result.rows.map(row => ({
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            vendorPartnerId: row.vendor_partner_id,
            vendorName: row.vendor_name,
            vendorEmail: row.vendor_email,
            orderDate: row.order_date ? row.order_date.toISOString().split('T')[0] : null,
            expectedDeliveryDate: row.expected_delivery_date ? row.expected_delivery_date.toISOString().split('T')[0] : null,
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
            data: purchaseOrders,
            count: purchaseOrders.length
        });

    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase orders',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/purchase-orders/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        const orgId = await getOrgId(req);

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`po.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`po.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`po.order_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`po.order_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE po.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE po.status = 'confirmed') as confirmed_count,
                COUNT(*) FILTER (WHERE po.status = 'fulfilled') as fulfilled_count,
                COALESCE(SUM(po.grand_total), 0) as total_amount,
                COALESCE(SUM(po.grand_total) FILTER (WHERE po.status = 'confirmed'), 0) as confirmed_amount
            FROM finance.purchase_orders po
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
        console.error('Error fetching purchase order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase order stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/purchase-orders/:id - Get single purchase order with lines
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const orderQuery = `
            SELECT 
                po.*,
                p.display_name as vendor_name,
                p.email as vendor_email,
                pr.name as project_name
            FROM finance.purchase_orders po
            LEFT JOIN catalog.partners p ON po.vendor_partner_id = p.id
            LEFT JOIN project.projects pr ON po.project_id = pr.id
            WHERE po.id = $1
        `;

        const orderResult = await pool.query(orderQuery, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        const row = orderResult.rows[0];
        const purchaseOrder = {
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            vendorPartnerId: row.vendor_partner_id,
            vendorName: row.vendor_name,
            vendorEmail: row.vendor_email,
            orderDate: row.order_date ? row.order_date.toISOString().split('T')[0] : null,
            expectedDeliveryDate: row.expected_delivery_date ? row.expected_delivery_date.toISOString().split('T')[0] : null,
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
                pol.*,
                prod.name as product_name,
                prod.product_code,
                uom.code as uom_code,
                uom.name as uom_name
            FROM finance.purchase_order_lines pol
            LEFT JOIN catalog.products prod ON pol.product_id = prod.id
            LEFT JOIN catalog.uoms uom ON pol.uom_id = uom.id
            WHERE pol.purchase_order_id = $1
            ORDER BY pol.id
        `;

        const linesResult = await pool.query(linesQuery, [id]);
        purchaseOrder.lines = linesResult.rows.map(line => ({
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
            lineTotal: parseFloat(line.line_total)
        }));

        res.status(200).json({
            success: true,
            data: purchaseOrder
        });

    } catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase order',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/purchase-orders - Create new purchase order
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            vendor_partner_id,
            order_date,
            expected_delivery_date,
            due_date,
            payment_terms_id,
            currency = 'INR',
            fx_rate,
            reference,
            notes,
            lines = []
        } = req.body;

        if (!vendor_partner_id) {
            return res.status(400).json({
                success: false,
                message: 'Vendor partner is required'
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

        const number = await generateNumber(orgId, 'PO');

        // Calculate totals from lines
        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        for (const line of lines) {
            const quantity = parseFloat(line.quantity || 1);
            const unitPrice = parseFloat(line.unit_price || 0);
            const discountPercent = parseFloat(line.discount_percent || 0);
            const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
            const taxAmount = parseFloat(line.tax_amount || 0);
            const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

            subtotal += quantity * unitPrice;
            discountTotal += discountAmount;
            taxTotal += taxAmount;
            grandTotal += lineTotal;
        }

        // Insert purchase order
        const orderQuery = `
            INSERT INTO finance.purchase_orders (
                org_id,
                number,
                project_id,
                vendor_partner_id,
                order_date,
                expected_delivery_date,
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
            RETURNING *
        `;

        const orderValues = [
            orgId,
            number,
            project_id || null,
            vendor_partner_id,
            order_date || new Date().toISOString().split('T')[0],
            expected_delivery_date || null,
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
        const purchaseOrder = orderResult.rows[0];

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
                INSERT INTO finance.purchase_order_lines (
                    org_id,
                    purchase_order_id,
                    product_id,
                    description,
                    quantity,
                    uom_id,
                    unit_price,
                    discount_percent,
                    discount_amount,
                    tax_amount,
                    tax_ids,
                    line_total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const lineResult = await pool.query(lineQuery, [
                orgId,
                purchaseOrder.id,
                line.product_id || null,
                line.description || '',
                quantity,
                line.uom_id || null,
                unitPrice,
                discountPercent,
                discountAmount,
                taxAmount,
                line.tax_ids || [],
                lineTotal
            ]);

            lineValues.push(lineResult.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            data: {
                id: purchaseOrder.id,
                number: purchaseOrder.number,
                projectId: purchaseOrder.project_id,
                vendorPartnerId: purchaseOrder.vendor_partner_id,
                orderDate: purchaseOrder.order_date ? purchaseOrder.order_date.toISOString().split('T')[0] : null,
                currency: purchaseOrder.currency,
                subtotal: parseFloat(purchaseOrder.subtotal),
                discountTotal: parseFloat(purchaseOrder.discount_total),
                taxTotal: parseFloat(purchaseOrder.tax_total),
                grandTotal: parseFloat(purchaseOrder.grand_total),
                status: purchaseOrder.status,
                lines: lineValues.map(l => ({
                    id: l.id,
                    productId: l.product_id,
                    description: l.description,
                    quantity: parseFloat(l.quantity),
                    unitPrice: parseFloat(l.unit_price),
                    lineTotal: parseFloat(l.line_total)
                })),
                createdAt: purchaseOrder.created_at
            }
        });

    } catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase order',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/purchase-orders/:id - Update purchase order
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            vendor_partner_id,
            order_date,
            expected_delivery_date,
            due_date,
            payment_terms_id,
            currency,
            fx_rate,
            reference,
            notes,
            lines
        } = req.body;

        const checkQuery = 'SELECT id, status FROM finance.purchase_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'closed' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit ${currentStatus} purchase order`
            });
        }

        const orgId = await getOrgId(req);

        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        if (lines && lines.length > 0) {
            await pool.query('DELETE FROM finance.purchase_order_lines WHERE purchase_order_id = $1', [id]);

            for (const line of lines) {
                const quantity = parseFloat(line.quantity || 1);
                const unitPrice = parseFloat(line.unit_price || 0);
                const discountPercent = parseFloat(line.discount_percent || 0);
                const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
                const taxAmount = parseFloat(line.tax_amount || 0);
                const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

                await pool.query(`
                    INSERT INTO finance.purchase_order_lines (
                        org_id, purchase_order_id, product_id, description, quantity,
                        uom_id, unit_price, discount_percent, discount_amount,
                        tax_amount, tax_ids, line_total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
                    lineTotal
                ]);

                subtotal += quantity * unitPrice;
                discountTotal += discountAmount;
                taxTotal += taxAmount;
                grandTotal += lineTotal;
            }
        }

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (project_id !== undefined) {
            updateFields.push(`project_id = $${paramIndex++}`);
            values.push(project_id || null);
        }
        if (vendor_partner_id !== undefined) {
            updateFields.push(`vendor_partner_id = $${paramIndex++}`);
            values.push(vendor_partner_id);
        }
        if (order_date !== undefined) {
            updateFields.push(`order_date = $${paramIndex++}`);
            values.push(order_date);
        }
        if (expected_delivery_date !== undefined) {
            updateFields.push(`expected_delivery_date = $${paramIndex++}`);
            values.push(expected_delivery_date || null);
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
            UPDATE finance.purchase_orders
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedOrder = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Purchase order updated successfully',
            data: {
                id: updatedOrder.id,
                number: updatedOrder.number,
                projectId: updatedOrder.project_id,
                vendorPartnerId: updatedOrder.vendor_partner_id,
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
        console.error('Error updating purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update purchase order',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/purchase-orders/:id/confirm - Confirm purchase order
// ============================================================================
router.patch('/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.purchase_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm purchase order with status: ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.purchase_orders
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
            message: 'Purchase order confirmed successfully',
            data: {
                id: confirmedOrder.id,
                status: confirmedOrder.status,
                postedAt: confirmedOrder.posted_at
            }
        });

    } catch (error) {
        console.error('Error confirming purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm purchase order',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/purchase-orders/:id/cancel - Cancel purchase order
// ============================================================================
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.purchase_orders WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'closed' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Purchase order is already ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.purchase_orders
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
            message: 'Purchase order cancelled successfully',
            data: {
                id: cancelledOrder.id,
                status: cancelledOrder.status,
                cancelledAt: cancelledOrder.cancelled_at
            }
        });

    } catch (error) {
        console.error('Error cancelling purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel purchase order',
            error: error.message
        });
    }
});

module.exports = router;


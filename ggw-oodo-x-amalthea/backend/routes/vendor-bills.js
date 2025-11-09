/**
 * ============================================================================
 * Vendor Bills Routes - Vendor Bill Management API
 * ============================================================================
 * Endpoints for managing vendor bills from finance.vendor_bills schema
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
async function generateNumber(orgId, docType = 'BILL') {
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
// GET /api/vendor-bills - List vendor bills with filtering
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
            conditions.push(`vb.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`vb.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (status) {
            let statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                conditions.push(`vb.status = ANY($${paramIndex++}::finance.invoice_status[])`);
                params.push(statusArray);
            }
        }

        if (vendor_partner_id) {
            conditions.push(`vb.vendor_partner_id = $${paramIndex++}`);
            params.push(vendor_partner_id);
        }

        if (date_from) {
            conditions.push(`vb.bill_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`vb.bill_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (amount_min) {
            conditions.push(`vb.grand_total >= $${paramIndex++}`);
            params.push(parseFloat(amount_min));
        }

        if (amount_max) {
            conditions.push(`vb.grand_total <= $${paramIndex++}`);
            params.push(parseFloat(amount_max));
        }

        if (search) {
            conditions.push(`(
                vb.number ILIKE $${paramIndex} OR 
                vb.reference ILIKE $${paramIndex} OR
                p.display_name ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                vb.id,
                vb.number,
                vb.project_id,
                vb.vendor_partner_id,
                vb.bill_date,
                vb.due_date,
                vb.currency,
                vb.subtotal,
                vb.discount_total,
                vb.tax_total,
                vb.grand_total,
                vb.status,
                vb.originated_from,
                vb.reference,
                vb.notes,
                vb.purchase_order_id,
                vb.posted_at,
                vb.paid_at,
                vb.cancelled_at,
                vb.created_at,
                vb.updated_at,
                p.display_name as vendor_name,
                p.email as vendor_email,
                pr.name as project_name
            FROM finance.vendor_bills vb
            LEFT JOIN catalog.partners p ON vb.vendor_partner_id = p.id
            LEFT JOIN project.projects pr ON vb.project_id = pr.id
            ${whereClause}
            ORDER BY vb.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        const result = await pool.query(query, params);

        const vendorBills = result.rows.map(row => ({
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            vendorPartnerId: row.vendor_partner_id,
            vendorName: row.vendor_name,
            vendorEmail: row.vendor_email,
            billDate: row.bill_date ? row.bill_date.toISOString().split('T')[0] : null,
            dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
            currency: row.currency,
            subtotal: parseFloat(row.subtotal || 0),
            discountTotal: parseFloat(row.discount_total || 0),
            taxTotal: parseFloat(row.tax_total || 0),
            grandTotal: parseFloat(row.grand_total || 0),
            status: row.status,
            originatedFrom: row.originated_from,
            reference: row.reference,
            notes: row.notes,
            purchaseOrderId: row.purchase_order_id,
            postedAt: row.posted_at,
            paidAt: row.paid_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: vendorBills,
            count: vendorBills.length
        });

    } catch (error) {
        console.error('Error fetching vendor bills:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor bills',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/vendor-bills/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        const orgId = await getOrgId(req);

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`vb.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`vb.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`vb.bill_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`vb.bill_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE vb.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE vb.status = 'posted') as posted_count,
                COUNT(*) FILTER (WHERE vb.status = 'paid') as paid_count,
                COALESCE(SUM(vb.grand_total), 0) as total_amount,
                COALESCE(SUM(vb.grand_total) FILTER (WHERE vb.status = 'posted'), 0) as posted_amount,
                COALESCE(SUM(vb.grand_total) FILTER (WHERE vb.status = 'paid'), 0) as paid_amount
            FROM finance.vendor_bills vb
            ${whereClause}
        `;

        const result = await pool.query(query, params);
        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            data: {
                totalCount: parseInt(stats.total_count) || 0,
                draftCount: parseInt(stats.draft_count) || 0,
                postedCount: parseInt(stats.posted_count) || 0,
                paidCount: parseInt(stats.paid_count) || 0,
                totalAmount: parseFloat(stats.total_amount) || 0,
                postedAmount: parseFloat(stats.posted_amount) || 0,
                paidAmount: parseFloat(stats.paid_amount) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching vendor bill stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor bill stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/vendor-bills/:id - Get single vendor bill with lines
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const billQuery = `
            SELECT 
                vb.*,
                p.display_name as vendor_name,
                p.email as vendor_email,
                pr.name as project_name,
                po.number as purchase_order_number
            FROM finance.vendor_bills vb
            LEFT JOIN catalog.partners p ON vb.vendor_partner_id = p.id
            LEFT JOIN project.projects pr ON vb.project_id = pr.id
            LEFT JOIN finance.purchase_orders po ON vb.purchase_order_id = po.id
            WHERE vb.id = $1
        `;

        const billResult = await pool.query(billQuery, [id]);

        if (billResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor bill not found'
            });
        }

        const row = billResult.rows[0];
        const vendorBill = {
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            vendorPartnerId: row.vendor_partner_id,
            vendorName: row.vendor_name,
            vendorEmail: row.vendor_email,
            billDate: row.bill_date ? row.bill_date.toISOString().split('T')[0] : null,
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
            originatedFrom: row.originated_from,
            reference: row.reference,
            notes: row.notes,
            purchaseOrderId: row.purchase_order_id,
            purchaseOrderNumber: row.purchase_order_number,
            billToSnapshot: row.bill_to_snapshot_json,
            shipToSnapshot: row.ship_to_snapshot_json,
            postedAt: row.posted_at,
            paidAt: row.paid_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        // Get lines
        const linesQuery = `
            SELECT 
                bl.*,
                prod.name as product_name,
                prod.product_code,
                uom.code as uom_code,
                uom.name as uom_name
            FROM finance.bill_lines bl
            LEFT JOIN catalog.products prod ON bl.product_id = prod.id
            LEFT JOIN catalog.uoms uom ON bl.uom_id = uom.id
            WHERE bl.bill_id = $1
            ORDER BY bl.id
        `;

        const linesResult = await pool.query(linesQuery, [id]);
        vendorBill.lines = linesResult.rows.map(line => ({
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
            purchaseOrderLineId: line.purchase_order_line_id
        }));

        res.status(200).json({
            success: true,
            data: vendorBill
        });

    } catch (error) {
        console.error('Error fetching vendor bill:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor bill',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/vendor-bills - Create new vendor bill
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            vendor_partner_id,
            bill_date,
            due_date,
            payment_terms_id,
            currency = 'INR',
            fx_rate,
            reference,
            notes,
            purchase_order_id,
            originated_from = 'manual',
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

        const number = await generateNumber(orgId, 'BILL');

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

        // Insert vendor bill
        const billQuery = `
            INSERT INTO finance.vendor_bills (
                org_id,
                number,
                project_id,
                vendor_partner_id,
                bill_date,
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
                purchase_order_id,
                originated_from,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'draft')
            RETURNING *
        `;

        const billValues = [
            orgId,
            number,
            project_id || null,
            vendor_partner_id,
            bill_date || new Date().toISOString().split('T')[0],
            due_date || null,
            payment_terms_id || null,
            currency,
            fx_rate || 1,
            subtotal,
            discountTotal,
            taxTotal,
            grandTotal,
            reference || null,
            notes || null,
            purchase_order_id || null,
            originated_from
        ];

        const billResult = await pool.query(billQuery, billValues);
        const vendorBill = billResult.rows[0];

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
                INSERT INTO finance.bill_lines (
                    org_id,
                    bill_id,
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
                    purchase_order_line_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            const lineResult = await pool.query(lineQuery, [
                orgId,
                vendorBill.id,
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
                line.purchase_order_line_id || null
            ]);

            lineValues.push(lineResult.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Vendor bill created successfully',
            data: {
                id: vendorBill.id,
                number: vendorBill.number,
                projectId: vendorBill.project_id,
                vendorPartnerId: vendorBill.vendor_partner_id,
                billDate: vendorBill.bill_date ? vendorBill.bill_date.toISOString().split('T')[0] : null,
                currency: vendorBill.currency,
                subtotal: parseFloat(vendorBill.subtotal),
                discountTotal: parseFloat(vendorBill.discount_total),
                taxTotal: parseFloat(vendorBill.tax_total),
                grandTotal: parseFloat(vendorBill.grand_total),
                status: vendorBill.status,
                lines: lineValues.map(l => ({
                    id: l.id,
                    productId: l.product_id,
                    description: l.description,
                    quantity: parseFloat(l.quantity),
                    unitPrice: parseFloat(l.unit_price),
                    lineTotal: parseFloat(l.line_total)
                })),
                createdAt: vendorBill.created_at
            }
        });

    } catch (error) {
        console.error('Error creating vendor bill:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create vendor bill',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/vendor-bills/:id - Update vendor bill
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            vendor_partner_id,
            bill_date,
            due_date,
            payment_terms_id,
            currency,
            fx_rate,
            reference,
            notes,
            purchase_order_id,
            lines
        } = req.body;

        const checkQuery = 'SELECT id, status FROM finance.vendor_bills WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor bill not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'paid' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit ${currentStatus} vendor bill`
            });
        }

        const orgId = await getOrgId(req);

        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        if (lines && lines.length > 0) {
            await pool.query('DELETE FROM finance.bill_lines WHERE bill_id = $1', [id]);

            for (const line of lines) {
                const quantity = parseFloat(line.quantity || 1);
                const unitPrice = parseFloat(line.unit_price || 0);
                const discountPercent = parseFloat(line.discount_percent || 0);
                const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
                const taxAmount = parseFloat(line.tax_amount || 0);
                const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

                await pool.query(`
                    INSERT INTO finance.bill_lines (
                        org_id, bill_id, product_id, description, quantity,
                        uom_id, unit_price, discount_percent, discount_amount,
                        tax_amount, tax_ids, line_total, purchase_order_line_id
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
                    line.purchase_order_line_id || null
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
        if (bill_date !== undefined) {
            updateFields.push(`bill_date = $${paramIndex++}`);
            values.push(bill_date);
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
        if (purchase_order_id !== undefined) {
            updateFields.push(`purchase_order_id = $${paramIndex++}`);
            values.push(purchase_order_id || null);
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
            UPDATE finance.vendor_bills
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedBill = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Vendor bill updated successfully',
            data: {
                id: updatedBill.id,
                number: updatedBill.number,
                projectId: updatedBill.project_id,
                vendorPartnerId: updatedBill.vendor_partner_id,
                billDate: updatedBill.bill_date ? updatedBill.bill_date.toISOString().split('T')[0] : null,
                currency: updatedBill.currency,
                subtotal: parseFloat(updatedBill.subtotal),
                discountTotal: parseFloat(updatedBill.discount_total),
                taxTotal: parseFloat(updatedBill.tax_total),
                grandTotal: parseFloat(updatedBill.grand_total),
                status: updatedBill.status,
                updatedAt: updatedBill.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating vendor bill:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vendor bill',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/vendor-bills/:id/post - Post vendor bill
// ============================================================================
router.patch('/:id/post', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.vendor_bills WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor bill not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot post vendor bill with status: ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.vendor_bills
            SET status = 'posted',
                posted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const postedBill = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Vendor bill posted successfully',
            data: {
                id: postedBill.id,
                status: postedBill.status,
                postedAt: postedBill.posted_at
            }
        });

    } catch (error) {
        console.error('Error posting vendor bill:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post vendor bill',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/vendor-bills/:id/cancel - Cancel vendor bill
// ============================================================================
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.vendor_bills WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor bill not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'paid' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Vendor bill is already ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.vendor_bills
            SET status = 'cancelled',
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const cancelledBill = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Vendor bill cancelled successfully',
            data: {
                id: cancelledBill.id,
                status: cancelledBill.status,
                cancelledAt: cancelledBill.cancelled_at
            }
        });

    } catch (error) {
        console.error('Error cancelling vendor bill:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel vendor bill',
            error: error.message
        });
    }
});

module.exports = router;


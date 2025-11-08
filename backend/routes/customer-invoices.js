/**
 * ============================================================================
 * Customer Invoices Routes - Customer Invoice Management API
 * ============================================================================
 * Endpoints for managing customer invoices from finance.customer_invoices schema
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
            const orgQuery = await pool.query('SELECT id FROM auth.orgs LIMIT 1');
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
async function generateNumber(orgId, docType = 'INV') {
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
// GET /api/customer-invoices - List customer invoices with filtering
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

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`ci.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`ci.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (status) {
            let statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                conditions.push(`ci.status = ANY($${paramIndex++}::finance.invoice_status[])`);
                params.push(statusArray);
            }
        }

        if (customer_partner_id) {
            conditions.push(`ci.customer_partner_id = $${paramIndex++}`);
            params.push(customer_partner_id);
        }

        if (date_from) {
            conditions.push(`ci.invoice_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`ci.invoice_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (amount_min) {
            conditions.push(`ci.grand_total >= $${paramIndex++}`);
            params.push(parseFloat(amount_min));
        }

        if (amount_max) {
            conditions.push(`ci.grand_total <= $${paramIndex++}`);
            params.push(parseFloat(amount_max));
        }

        if (search) {
            conditions.push(`(
                ci.number ILIKE $${paramIndex} OR 
                ci.reference ILIKE $${paramIndex} OR
                p.display_name ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                ci.id,
                ci.number,
                ci.project_id,
                ci.customer_partner_id,
                ci.invoice_date,
                ci.due_date,
                ci.currency,
                ci.subtotal,
                ci.discount_total,
                ci.tax_total,
                ci.grand_total,
                ci.status,
                ci.originated_from,
                ci.reference,
                ci.notes,
                ci.posted_at,
                ci.paid_at,
                ci.cancelled_at,
                ci.created_at,
                ci.updated_at,
                p.display_name as customer_name,
                p.email as customer_email,
                pr.name as project_name
            FROM finance.customer_invoices ci
            LEFT JOIN catalog.partners p ON ci.customer_partner_id = p.id
            LEFT JOIN project.projects pr ON ci.project_id = pr.id
            ${whereClause}
            ORDER BY ci.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit) || 100, parseInt(offset) || 0);

        const result = await pool.query(query, params);

        const invoices = result.rows.map(row => ({
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            customerPartnerId: row.customer_partner_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            invoiceDate: row.invoice_date ? row.invoice_date.toISOString().split('T')[0] : null,
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
            postedAt: row.posted_at,
            paidAt: row.paid_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).json({
            success: true,
            data: invoices,
            count: invoices.length
        });

    } catch (error) {
        console.error('Error fetching customer invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer invoices',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/customer-invoices/stats - Get header widget stats
// ============================================================================
router.get('/stats', async (req, res) => {
    try {
        const { project_id, date_from, date_to } = req.query;
        
        const orgId = await getOrgId(req);

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (orgId) {
            conditions.push(`ci.org_id = $${paramIndex++}`);
            params.push(orgId);
        }

        if (project_id) {
            conditions.push(`ci.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            conditions.push(`ci.invoice_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            conditions.push(`ci.invoice_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE ci.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE ci.status = 'posted') as posted_count,
                COUNT(*) FILTER (WHERE ci.status = 'paid') as paid_count,
                COALESCE(SUM(ci.grand_total), 0) as total_amount,
                COALESCE(SUM(ci.grand_total) FILTER (WHERE ci.status = 'posted'), 0) as posted_amount,
                COALESCE(SUM(ci.grand_total) FILTER (WHERE ci.status = 'paid'), 0) as paid_amount
            FROM finance.customer_invoices ci
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
        console.error('Error fetching customer invoice stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer invoice stats',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/customer-invoices/:id - Get single customer invoice with lines
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const invoiceQuery = `
            SELECT 
                ci.*,
                p.display_name as customer_name,
                p.email as customer_email,
                pr.name as project_name
            FROM finance.customer_invoices ci
            LEFT JOIN catalog.partners p ON ci.customer_partner_id = p.id
            LEFT JOIN project.projects pr ON ci.project_id = pr.id
            WHERE ci.id = $1
        `;

        const invoiceResult = await pool.query(invoiceQuery, [id]);

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer invoice not found'
            });
        }

        const row = invoiceResult.rows[0];
        const invoice = {
            id: row.id,
            number: row.number,
            projectId: row.project_id,
            projectName: row.project_name,
            customerPartnerId: row.customer_partner_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            invoiceDate: row.invoice_date ? row.invoice_date.toISOString().split('T')[0] : null,
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
                il.*,
                prod.name as product_name,
                prod.product_code,
                uom.code as uom_code,
                uom.name as uom_name
            FROM finance.invoice_lines il
            LEFT JOIN catalog.products prod ON il.product_id = prod.id
            LEFT JOIN catalog.uoms uom ON il.uom_id = uom.id
            WHERE il.invoice_id = $1
            ORDER BY il.id
        `;

        const linesResult = await pool.query(linesQuery, [id]);
        invoice.lines = linesResult.rows.map(line => ({
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
            sourceType: line.source_type,
            sourceId: line.source_id,
            projectId: line.project_id,
            taskId: line.task_id,
            salesOrderLineId: line.sales_order_line_id
        }));

        res.status(200).json({
            success: true,
            data: invoice
        });

    } catch (error) {
        console.error('Error fetching customer invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer invoice',
            error: error.message
        });
    }
});

// ============================================================================
// POST /api/customer-invoices - Create new customer invoice
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const {
            project_id,
            customer_partner_id,
            invoice_date,
            due_date,
            payment_terms_id,
            currency = 'INR',
            fx_rate,
            reference,
            notes,
            originated_from = 'manual',
            lines = []
        } = req.body;

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

        const number = await generateNumber(orgId, 'INV');

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

        // Insert customer invoice
        const invoiceQuery = `
            INSERT INTO finance.customer_invoices (
                org_id,
                number,
                project_id,
                customer_partner_id,
                invoice_date,
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
                originated_from,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
            RETURNING *
        `;

        const invoiceValues = [
            orgId,
            number,
            project_id || null,
            customer_partner_id,
            invoice_date || new Date().toISOString().split('T')[0],
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
            originated_from
        ];

        const invoiceResult = await pool.query(invoiceQuery, invoiceValues);
        const invoice = invoiceResult.rows[0];

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
                INSERT INTO finance.invoice_lines (
                    org_id,
                    invoice_id,
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
                    source_type,
                    source_id,
                    project_id,
                    task_id,
                    sales_order_line_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `;

            const lineResult = await pool.query(lineQuery, [
                orgId,
                invoice.id,
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
                line.source_type || 'manual',
                line.source_id || null,
                line.project_id || project_id || null,
                line.task_id || null,
                line.sales_order_line_id || null
            ]);

            lineValues.push(lineResult.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Customer invoice created successfully',
            data: {
                id: invoice.id,
                number: invoice.number,
                projectId: invoice.project_id,
                customerPartnerId: invoice.customer_partner_id,
                invoiceDate: invoice.invoice_date ? invoice.invoice_date.toISOString().split('T')[0] : null,
                currency: invoice.currency,
                subtotal: parseFloat(invoice.subtotal),
                discountTotal: parseFloat(invoice.discount_total),
                taxTotal: parseFloat(invoice.tax_total),
                grandTotal: parseFloat(invoice.grand_total),
                status: invoice.status,
                lines: lineValues.map(l => ({
                    id: l.id,
                    productId: l.product_id,
                    description: l.description,
                    quantity: parseFloat(l.quantity),
                    unitPrice: parseFloat(l.unit_price),
                    lineTotal: parseFloat(l.line_total)
                })),
                createdAt: invoice.created_at
            }
        });

    } catch (error) {
        console.error('Error creating customer invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create customer invoice',
            error: error.message
        });
    }
});

// ============================================================================
// PUT /api/customer-invoices/:id - Update customer invoice
// ============================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            customer_partner_id,
            invoice_date,
            due_date,
            payment_terms_id,
            currency,
            fx_rate,
            reference,
            notes,
            lines
        } = req.body;

        const checkQuery = 'SELECT id, status FROM finance.customer_invoices WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer invoice not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'paid' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit ${currentStatus} customer invoice`
            });
        }

        const orgId = await getOrgId(req);

        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        if (lines && lines.length > 0) {
            await pool.query('DELETE FROM finance.invoice_lines WHERE invoice_id = $1', [id]);

            for (const line of lines) {
                const quantity = parseFloat(line.quantity || 1);
                const unitPrice = parseFloat(line.unit_price || 0);
                const discountPercent = parseFloat(line.discount_percent || 0);
                const discountAmount = (quantity * unitPrice * discountPercent / 100) + parseFloat(line.discount_amount || 0);
                const taxAmount = parseFloat(line.tax_amount || 0);
                const lineTotal = (quantity * unitPrice) - discountAmount + taxAmount;

                await pool.query(`
                    INSERT INTO finance.invoice_lines (
                        org_id, invoice_id, product_id, description, quantity,
                        uom_id, unit_price, discount_percent, discount_amount,
                        tax_amount, tax_ids, line_total, source_type, source_id,
                        project_id, task_id, sales_order_line_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
                    line.source_type || 'manual',
                    line.source_id || null,
                    line.project_id || project_id || null,
                    line.task_id || null,
                    line.sales_order_line_id || null
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
        if (customer_partner_id !== undefined) {
            updateFields.push(`customer_partner_id = $${paramIndex++}`);
            values.push(customer_partner_id);
        }
        if (invoice_date !== undefined) {
            updateFields.push(`invoice_date = $${paramIndex++}`);
            values.push(invoice_date);
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
            UPDATE finance.customer_invoices
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const updatedInvoice = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Customer invoice updated successfully',
            data: {
                id: updatedInvoice.id,
                number: updatedInvoice.number,
                projectId: updatedInvoice.project_id,
                customerPartnerId: updatedInvoice.customer_partner_id,
                invoiceDate: updatedInvoice.invoice_date ? updatedInvoice.invoice_date.toISOString().split('T')[0] : null,
                currency: updatedInvoice.currency,
                subtotal: parseFloat(updatedInvoice.subtotal),
                discountTotal: parseFloat(updatedInvoice.discount_total),
                taxTotal: parseFloat(updatedInvoice.tax_total),
                grandTotal: parseFloat(updatedInvoice.grand_total),
                status: updatedInvoice.status,
                updatedAt: updatedInvoice.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating customer invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update customer invoice',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/customer-invoices/:id/post - Post customer invoice
// ============================================================================
router.patch('/:id/post', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.customer_invoices WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer invoice not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot post customer invoice with status: ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.customer_invoices
            SET status = 'posted',
                posted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const postedInvoice = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Customer invoice posted successfully',
            data: {
                id: postedInvoice.id,
                status: postedInvoice.status,
                postedAt: postedInvoice.posted_at
            }
        });

    } catch (error) {
        console.error('Error posting customer invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post customer invoice',
            error: error.message
        });
    }
});

// ============================================================================
// PATCH /api/customer-invoices/:id/cancel - Cancel customer invoice
// ============================================================================
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = 'SELECT id, status FROM finance.customer_invoices WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer invoice not found'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus === 'paid' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Customer invoice is already ${currentStatus}`
            });
        }

        const updateQuery = `
            UPDATE finance.customer_invoices
            SET status = 'cancelled',
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);
        const cancelledInvoice = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Customer invoice cancelled successfully',
            data: {
                id: cancelledInvoice.id,
                status: cancelledInvoice.status,
                cancelledAt: cancelledInvoice.cancelled_at
            }
        });

    } catch (error) {
        console.error('Error cancelling customer invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel customer invoice',
            error: error.message
        });
    }
});

module.exports = router;


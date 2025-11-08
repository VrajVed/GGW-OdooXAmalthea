/**
 * ============================================================================
 * User Routes - Authentication and User Management
 * ============================================================================
 * Security Features:
 * - Password hashing with bcrypt (cost factor 12)
 * - Input validation and sanitization
 * - SQL injection prevention via parameterized queries
 * - Rate limiting recommended (implement with express-rate-limit)
 * - Error handling without exposing sensitive information
 * ============================================================================
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { query, getClient } = require('../config/database');

const router = express.Router();

// Bcrypt salt rounds - higher is more secure but slower
// 12 is a good balance for 2025 hardware
const SALT_ROUNDS = 12;

/**
 * ============================================================================
 * POST /api/users/register
 * Register a new user
 * ============================================================================
 */
router.post('/register', async (req, res) => {
    // Destructure and validate request body
    const { firstName, lastName, workEmail, role, password } = req.body;
    
    try {
        // ========================================
        // Input Validation
        // ========================================
        if (!firstName || !lastName || !workEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, workEmail, and password are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(workEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Validate role if provided
        const validRoles = ['admin', 'manager', 'user', 'guest'];
        const userRole = role || 'user';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }
        
        // ========================================
        // Hash Password (CRITICAL SECURITY STEP)
        // ========================================
        console.log('Hashing password...');
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // ========================================
        // Insert User into Database
        // Using parameterized query to prevent SQL injection
        // ========================================
        const insertQuery = `
            INSERT INTO auth.users (org_id, full_name, email, password_hash, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, full_name, is_active, created_at
        `;
        
        // Use default org_id from seed data
        const defaultOrgId = '00000000-0000-0000-0000-000000000001';
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        const values = [
            defaultOrgId,
            fullName,
            workEmail.toLowerCase().trim(),  // Normalize email to lowercase
            passwordHash,
            true  // is_active
        ];
        
        const result = await query(insertQuery, values);
        
        // ========================================
        // Success Response (Never return password)
        // ========================================
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: result.rows[0]
            }
        });
        
        console.log(`✓ New user registered: ${workEmail}`);
        
    } catch (error) {
        // ========================================
        // Error Handling
        // ========================================
        console.error('Registration error:', error.message);
        
        // Handle duplicate email (unique constraint violation)
        if (error.code === '23505') {  // PostgreSQL unique violation code
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }
        
        // Handle check constraint violations
        if (error.code === '23514') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format or constraint violation'
            });
        }
        
        // Generic error response (don't expose internal details)
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration. Please try again later.'
        });
    }
});

/**
 * ============================================================================
 * POST /api/users/login
 * Authenticate a user
 * ============================================================================
 */
router.post('/login', async (req, res) => {
    const { workEmail, password } = req.body;
    
    try {
        // Input validation
        if (!workEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Fetch user from database
        const selectQuery = `
            SELECT id, org_id, email, full_name, password_hash, is_active
            FROM auth.users
            WHERE email = $1
        `;
        
        const result = await query(selectQuery, [workEmail.toLowerCase().trim()]);
        
        // Check if user exists
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'  // Don't reveal which one is wrong
            });
        }
        
        const user = result.rows[0];
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login timestamp
        await query(
            'UPDATE auth.users SET updated_at = CURRENT_TIMESTAMP WHERE email = $1',
            [user.email]
        );
        
        // Successful login - return user data (excluding password)
        const { password_hash, ...userData } = user;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData
            }
        });
        
        console.log(`✓ User logged in: ${workEmail}`);
        
        // TODO: In production, generate JWT token here
        // const token = jwt.sign({ email: user.work_email, role: user.role }, process.env.JWT_SECRET);
        
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login. Please try again later.'
        });
    }
});

/**
 * ============================================================================
 * GET /api/users
 * Get all users (admin only in production)
 * ============================================================================
 */
router.get('/', async (req, res) => {
    try {
        // Using the safe view that excludes passwords
        const selectQuery = `
            SELECT id, org_id, email, full_name, is_active, created_at, updated_at
            FROM auth.users
            ORDER BY created_at DESC
        `;
        
        const result = await query(selectQuery);
        
        res.status(200).json({
            success: true,
            data: {
                users: result.rows,
                count: result.rows.length
            }
        });
        
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching users'
        });
    }
});

/**
 * ============================================================================
 * GET /api/users/:email
 * Get a specific user by email
 * ============================================================================
 */
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const selectQuery = `
            SELECT id, org_id, email, full_name, is_active, created_at, updated_at
            FROM auth.users
            WHERE email = $1
        `;
        
        const result = await query(selectQuery, [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                user: result.rows[0]
            }
        });
        
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching user'
        });
    }
});

/**
 * ============================================================================
 * PUT /api/users/:email
 * Update user information
 * ============================================================================
 */
router.put('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { fullName, isActive } = req.body;
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (fullName) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(fullName.trim());
        }
        
        if (typeof isActive === 'boolean') {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        values.push(email.toLowerCase());
        
        const updateQuery = `
            UPDATE auth.users
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE email = $${paramCount}
            RETURNING id, email, full_name, is_active, updated_at
        `;
        
        const result = await query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user: result.rows[0]
            }
        });
        
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating user'
        });
    }
});

/**
 * ============================================================================
 * DELETE /api/users/:email
 * Soft delete user (deactivate account)
 * ============================================================================
 */
router.delete('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // Soft delete - just mark as inactive
        const updateQuery = `
            UPDATE auth.users
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE email = $1
            RETURNING email
        `;
        
        const result = await query(updateQuery, [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting user'
        });
    }
});

module.exports = router;

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
            INSERT INTO users (first_name, last_name, work_email, role, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING work_email, first_name, last_name, role, created_at
        `;
        
        const values = [
            firstName.trim(),
            lastName.trim(),
            workEmail.toLowerCase().trim(),  // Normalize email to lowercase
            userRole,
            passwordHash
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
            SELECT work_email, first_name, last_name, role, password_hash, is_active
            FROM users
            WHERE work_email = $1
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
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE work_email = $1',
            [user.work_email]
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
            SELECT work_email, first_name, last_name, role, created_at, last_login, is_active
            FROM users
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
            SELECT work_email, first_name, last_name, role, created_at, last_login, is_active
            FROM users
            WHERE work_email = $1
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
        const { firstName, lastName, role } = req.body;
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (firstName) {
            updates.push(`first_name = $${paramCount++}`);
            values.push(firstName.trim());
        }
        
        if (lastName) {
            updates.push(`last_name = $${paramCount++}`);
            values.push(lastName.trim());
        }
        
        if (role) {
            const validRoles = ['admin', 'manager', 'user', 'guest'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
            }
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        values.push(email.toLowerCase());
        
        const updateQuery = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE work_email = $${paramCount}
            RETURNING work_email, first_name, last_name, role, updated_at
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
            UPDATE users
            SET is_active = FALSE
            WHERE work_email = $1
            RETURNING work_email
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

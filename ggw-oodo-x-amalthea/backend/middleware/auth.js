/**
 * ============================================================================
 * Authentication & Authorization Middleware
 * ============================================================================
 * JWT-based authentication and role-based authorization
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Authenticate middleware - Verifies JWT token and attaches user to request
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide a valid token.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Token is missing.'
            });
        }

        // Verify token
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        const decoded = jwt.verify(token, jwtSecret);

        // Fetch user from database to ensure they still exist and are active
        const userQuery = await pool.query(
            `SELECT 
                u.id, 
                u.org_id, 
                u.email, 
                u.full_name, 
                u.is_active,
                COALESCE(
                    (SELECT ur.role 
                     FROM auth.user_roles ur 
                     WHERE ur.user_id = u.id 
                     LIMIT 1), 
                    'team_member'
                ) as role
            FROM auth.users u
            WHERE u.id = $1`,
            [decoded.id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        const user = userQuery.rows[0];

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Attach user to request object
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            org_id: user.org_id,
            full_name: user.full_name
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed. Please try again.'
        });
    }
};

/**
 * Authorize middleware - Checks if user has required role
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to access this resource.'
            });
        }

        next();
    };
};

module.exports = {
    authenticateUser,
    authorizeRole
};


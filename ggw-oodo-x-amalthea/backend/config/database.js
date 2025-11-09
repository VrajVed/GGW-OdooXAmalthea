/**
 * ============================================================================
 * PostgreSQL Database Configuration
 * ============================================================================
 * Best Practices Implemented:
 * - Environment variables for sensitive data
 * - Connection pooling for performance
 * - SSL/TLS support for production
 * - Query timeout configuration
 * - Proper error handling
 * ============================================================================
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * Database connection pool configuration
 * Using connection pooling is critical for production applications
 * to manage database connections efficiently
 */
const poolConfig = {
    // Connection parameters - NEVER hardcode these in production
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'your_database_name',
    user: process.env.DB_USER || 'your_username',
    password: process.env.DB_PASSWORD || 'your_password',
    
    // Pool configuration for optimal performance
    max: parseInt(process.env.DB_POOL_MAX) || 20,           // Maximum number of clients in pool
    min: parseInt(process.env.DB_POOL_MIN) || 5,            // Minimum number of clients in pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,  // Close idle clients after 30s
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Connection timeout
    
    // Query timeout - prevent long-running queries from blocking
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
    
    // SSL configuration for production (required for many cloud providers)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false  // Set to true with proper certificates in production
    } : false,
    
    // Application name for monitoring and debugging
    application_name: process.env.APP_NAME || 'user_management_app'
};

// Create the connection pool
const pool = new Pool(poolConfig);

/**
 * Event listeners for pool monitoring and debugging
 * These are crucial for production monitoring
 */

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);  // Exit process on unexpected errors
});

// Set search_path and log when a new client is connected
pool.on('connect', async (client) => {
    try {
        // Set search_path to include 'auth' schema
        await client.query('SET search_path TO "$user", public, auth');
        console.log('New client connected to database (search_path set)');
    } catch (error) {
        console.error('Error setting search_path:', error);
        console.log('New client connected to database (search_path failed)');
    }
});

// Log when a client is removed from the pool
pool.on('remove', (client) => {
    console.log('Client removed from pool');
});

/**
 * Test database connection
 * Call this function on application startup to verify database connectivity
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✓ Database connection successful');
        console.log('  Current Time:', result.rows[0].current_time);
        console.log('  PostgreSQL Version:', result.rows[0].postgres_version);
        client.release();
        return true;
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        throw error;
    }
}

/**
 * Execute a query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters (for prepared statements)
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries (queries taking more than 1 second)
        if (duration > 1000) {
            console.warn(`⚠ Slow query detected (${duration}ms):`, text);
        }
        
        return result;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Get a client from the pool for transaction handling
 * Use this when you need to execute multiple queries in a transaction
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
    const client = await pool.connect();
    
    // Add query method to client for consistency
    const originalQuery = client.query;
    const originalRelease = client.release;
    
    // Track if client has been released
    let released = false;
    
    // Override release to prevent double-release
    client.release = () => {
        if (released) {
            console.warn('⚠ Client has already been released');
            return;
        }
        released = true;
        return originalRelease.apply(client);
    };
    
    // Log query execution for debugging
    client.query = (...args) => {
        if (released) {
            throw new Error('Cannot query - client has been released');
        }
        return originalQuery.apply(client, args);
    };
    
    return client;
}

/**
 * Graceful shutdown - close all database connections
 * Call this when your application is shutting down
 */
async function closePool() {
    try {
        await pool.end();
        console.log('✓ Database pool closed successfully');
    } catch (error) {
        console.error('✗ Error closing database pool:', error.message);
        throw error;
    }
}

// Export pool and utility functions
module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    closePool
};

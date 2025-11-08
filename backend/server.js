/**
 * ============================================================================
 * Express Server - User Management API
 * ============================================================================
 * Production-ready features:
 * - CORS configuration
 * - Security headers (helmet)
 * - Request logging (morgan)
 * - JSON parsing with size limits
 * - Error handling middleware
 * - Graceful shutdown
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database utilities
const { testConnection, closePool } = require('./config/database');

// Import routes
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// ============================================================================
// Middleware Configuration
// ============================================================================

// Security middleware - sets various HTTP headers
app.use(helmet());

// CORS configuration - adjust for your frontend domain in production
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400  // 24 hours
};
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV === 'production') {
    // Combined format for production
    app.use(morgan('combined'));
} else {
    // Dev format for development
    app.use(morgan('dev'));
}

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API base endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'User Management API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            register: 'POST /api/users/register',
            login: 'POST /api/users/login'
        }
    });
});

// User routes
app.use('/api/users', userRoutes);

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 handler - route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Don't expose error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;
    
    res.status(err.status || 500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ============================================================================
// Server Initialization
// ============================================================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

let server;

async function startServer() {
    try {
        // Test database connection before starting server
        console.log('Testing database connection...');
        await testConnection();
        
        // Start Express server
        server = app.listen(PORT, HOST, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 Server Status');
            console.log('='.repeat(60));
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Server running on: http://${HOST}:${PORT}`);
            console.log(`Health check: http://${HOST}:${PORT}/health`);
            console.log(`API endpoint: http://${HOST}:${PORT}/api`);
            console.log('='.repeat(60) + '\n');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    if (server) {
        server.close(async () => {
            console.log('✓ HTTP server closed');
            
            // Close database connections
            try {
                await closePool();
                console.log('✓ Database connections closed');
                console.log('✓ Graceful shutdown complete');
                process.exit(0);
            } catch (error) {
                console.error('✗ Error during shutdown:', error.message);
                process.exit(1);
            }
        });
    }
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

module.exports = app;

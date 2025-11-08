-- ============================================================================
-- PostgreSQL Database Schema
-- Description: User management table with security best practices
-- Author: Database Administrator
-- Date: 2025-11-08
-- ============================================================================

-- Drop existing table if it exists (use with caution in production)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    -- Primary Key: Using work_email as natural primary key
    work_email VARCHAR(255) PRIMARY KEY,
    
    -- User Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Role-based access control
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    
    -- Password: Store hashed passwords only (NEVER plain text)
    -- Recommended: Use bcrypt with cost factor 12+
    password_hash VARCHAR(255) NOT NULL,
    
    -- Audit columns (best practice for tracking)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT email_format CHECK (work_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT role_check CHECK (role IN ('admin', 'manager', 'user', 'guest'))
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_name ON users(last_name);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function before any UPDATE
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for safe user data access (excludes password)
CREATE OR REPLACE VIEW users_safe AS
SELECT 
    work_email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at,
    last_login,
    is_active
FROM users;

-- Grant appropriate permissions (adjust based on your application user)
-- GRANT SELECT, INSERT, UPDATE ON users TO your_app_user;
-- GRANT SELECT ON users_safe TO your_app_user;

-- Sample comment for documentation
COMMENT ON TABLE users IS 'User authentication and profile information table';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt - NEVER store plain text passwords';
COMMENT ON COLUMN users.work_email IS 'Primary key - Unique work email address for authentication';

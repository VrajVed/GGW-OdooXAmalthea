# User Management System - Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [PostgreSQL Installation & Setup](#postgresql-installation--setup)
3. [Database Configuration](#database-configuration)
4. [Backend Setup](#backend-setup)
5. [API Testing](#api-testing)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/windows/)
- **npm** (comes with Node.js)

### Verify Installations
```powershell
node --version
npm --version
psql --version
```

---

## 🐘 PostgreSQL Installation & Setup

### Step 1: Install PostgreSQL on Windows

1. Download PostgreSQL installer from [official website](https://www.postgresql.org/download/windows/)
2. Run the installer (postgresql-xx.x-x-windows-x64.exe)
3. During installation:
   - **Port**: Keep default `5432`
   - **Password**: Set a strong password for the `postgres` superuser
   - **Locale**: Keep default
4. Complete the installation

### Step 2: Verify PostgreSQL Service

Open PowerShell as Administrator:
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If not running, start it
Start-Service -Name postgresql-x64-xx
```

### Step 3: Access PostgreSQL Command Line

```powershell
# Option 1: Using psql (add to PATH if not already)
psql -U postgres

# Option 2: Using pgAdmin (GUI tool installed with PostgreSQL)
# Open pgAdmin from Start Menu
```

---

## 🗄️ Database Configuration

### Step 1: Create Database

Open PostgreSQL command line (psql) and run:

```sql
-- Create the database
CREATE DATABASE user_management_db;

-- Connect to the new database
\c user_management_db

-- Verify connection
SELECT current_database();
```

### Step 2: Create Database Schema

From PowerShell, navigate to your backend directory:

```powershell
cd d:\Hackathons\ggw-oodo-x-amalthea\backend

# Run the schema file
psql -U postgres -d user_management_db -f database/schema.sql
```

### Step 3: Verify Schema Creation

```powershell
# Connect to database
psql -U postgres -d user_management_db

# Inside psql, run:
```

```sql
-- List all tables
\dt

-- Describe users table
\d users

-- View the safe users view
\dv

-- Check indexes
\di

-- You should see:
-- Table: users
-- View: users_safe
-- Indexes: idx_users_role, idx_users_active, idx_users_last_name
```

---

## 🚀 Backend Setup

### Step 1: Install Dependencies

```powershell
cd d:\Hackathons\ggw-oodo-x-amalthea\backend

# Install all required packages
npm install
```

This will install:
- **express** - Web framework
- **pg** - PostgreSQL client
- **bcrypt** - Password hashing
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **dotenv** - Environment variables
- **nodemon** - Auto-restart during development (dev dependency)

### Step 2: Configure Environment Variables

```powershell
# Copy the example file
copy .env.example .env

# Edit .env file with your actual values
notepad .env
```

**Important**: Update these values in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management_db
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
```

### Step 3: Start the Server

```powershell
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Expected output:
```
Testing database connection...
New client connected to database
✓ Database connection successful
  Current Time: 2025-11-08 ...
  PostgreSQL Version: PostgreSQL 14.x ...

============================================================
🚀 Server Status
============================================================
Environment: development
Server running on: http://0.0.0.0:5000
Health check: http://0.0.0.0:5000/health
API endpoint: http://0.0.0.0:5000/api
============================================================
```

---

## 🧪 API Testing

### Using cURL (PowerShell)

#### 1. Health Check
```powershell
curl http://localhost:5000/health
```

#### 2. Register a New User
```powershell
$body = @{
    firstName = "John"
    lastName = "Doe"
    workEmail = "john.doe@company.com"
    role = "user"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

#### 3. Login
```powershell
$body = @{
    workEmail = "john.doe@company.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

#### 4. Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Method GET
```

#### 5. Get Specific User
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users/john.doe@company.com" -Method GET
```

#### 6. Update User
```powershell
$body = @{
    firstName = "Jane"
    role = "manager"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/john.doe@company.com" `
    -Method PUT `
    -Body $body `
    -ContentType "application/json"
```

### Using Postman

1. Create a new collection
2. Add requests for each endpoint
3. Set Content-Type header to `application/json`
4. Use the examples above for request bodies

---

## 🔒 Security Best Practices

### 1. Password Security
- ✅ Passwords are hashed using **bcrypt** with cost factor 12
- ✅ Original passwords are never stored in the database
- ✅ Minimum password length: 8 characters
- ⚠️ **Recommendation**: Enforce complexity (uppercase, lowercase, numbers, special chars)

### 2. Database Security
```sql
-- Create a dedicated application user (recommended)
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT ON users_safe TO app_user;

-- Update .env with new credentials
DB_USER=app_user
DB_PASSWORD=strong_password
```

### 3. SQL Injection Prevention
- ✅ All queries use **parameterized statements** ($1, $2, etc.)
- ✅ Never concatenate user input into SQL strings

### 4. Input Validation
- ✅ Email format validation
- ✅ Required field checks
- ✅ Role validation against whitelist
- ⚠️ **Recommendation**: Add rate limiting for login attempts

### 5. Error Handling
- ✅ Generic error messages to clients (don't expose internal details)
- ✅ Detailed logging on server side
- ✅ Different error codes for different scenarios

### 6. Environment Variables
```powershell
# Add to .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
```

### 7. HTTPS in Production
- Use SSL/TLS certificates
- Set `ssl: { rejectUnauthorized: true }` in database config
- Configure reverse proxy (nginx, Apache)

### 8. Additional Recommendations

#### Install JWT for Token-Based Authentication
```powershell
npm install jsonwebtoken
```

#### Install Rate Limiting
```powershell
npm install express-rate-limit
```

Example implementation:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🔍 Troubleshooting

### Database Connection Issues

**Problem**: "Connection refused" or "ECONNREFUSED"
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Start service if stopped
Start-Service -Name postgresql-x64-xx

# Check if port 5432 is in use
netstat -an | findstr "5432"
```

**Problem**: "password authentication failed"
- Verify credentials in `.env` file
- Check PostgreSQL authentication config (`pg_hba.conf`)

### Port Already in Use

**Problem**: "EADDRINUSE: address already in use :::5000"
```powershell
# Find process using port 5000
netstat -ano | findstr ":5000"

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in .env file
```

### bcrypt Installation Issues on Windows
```powershell
# Install windows build tools
npm install --global windows-build-tools

# Rebuild bcrypt
npm rebuild bcrypt --build-from-source
```

### Schema Creation Fails
```powershell
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS user_management_db;"
psql -U postgres -c "CREATE DATABASE user_management_db;"
psql -U postgres -d user_management_db -f database/schema.sql
```

---

## 📊 Database Monitoring

### Useful PostgreSQL Commands

```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'user_management_db';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('users'));

-- View recent queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

---

## 📝 Next Steps

1. **Implement JWT Authentication**
   - Generate tokens on login
   - Validate tokens on protected routes
   - Add refresh token mechanism

2. **Add Email Verification**
   - Send verification email on registration
   - Verify email before account activation

3. **Implement Password Reset**
   - Generate reset tokens
   - Send reset links via email
   - Validate and update passwords

4. **Add Input Sanitization**
   - Install: `npm install express-validator`
   - Sanitize all user inputs

5. **Set Up Logging**
   - Install: `npm install winston`
   - Log to files for production monitoring

6. **Add Unit Tests**
   - Install: `npm install --save-dev jest supertest`
   - Write tests for routes and database functions

7. **Deploy to Production**
   - Set up CI/CD pipeline
   - Configure environment variables
   - Set up database backups
   - Enable SSL/TLS
   - Configure monitoring and alerts

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Need Help?** Check the logs in your terminal or PostgreSQL logs at:
`C:\Program Files\PostgreSQL\xx\data\log\`

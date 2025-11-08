# 🎓 PostgreSQL + Node.js Setup - Summary for Students

## What We've Built

A **production-grade** user management system with:
- PostgreSQL database with security best practices
- Node.js/Express REST API
- Secure password hashing
- Complete CRUD operations
- Proper error handling and validation

---

## 📂 Files Created

### 1. **Database Schema** (`database/schema.sql`)
- Creates `users` table with proper constraints
- Adds indexes for performance
- Implements automatic timestamp updates
- Creates a safe view (excludes passwords)
- **Key Feature**: Email validation at database level

### 2. **Database Configuration** (`config/database.js`)
- Connection pooling (critical for production!)
- Query timeout protection
- Error monitoring
- SSL support for production
- **Key Feature**: Automatic connection management

### 3. **User Routes** (`routes/users.js`)
- **POST** `/api/users/register` - Create new user
- **POST** `/api/users/login` - Authenticate user
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:email` - Get specific user
- **PUT** `/api/users/:email` - Update user
- **DELETE** `/api/users/:email` - Soft delete user
- **Key Feature**: bcrypt password hashing (12 rounds)

### 4. **Express Server** (`server.js`)
- Complete Express setup
- Security middleware (helmet, cors)
- Request logging
- Graceful shutdown
- **Key Feature**: Production-ready error handling

### 5. **Documentation**
- `SETUP_GUIDE.md` - Step-by-step setup instructions
- `API_DOCUMENTATION.md` - Complete API reference
- `README.md` - Project overview
- `.env.example` - Configuration template

---

## 🔐 Security Features (Senior DBA Perspective)

### ✅ What We Got Right

1. **Password Security**
   - ✅ Passwords NEVER stored in plain text
   - ✅ bcrypt with cost factor 12 (future-proof)
   - ✅ Passwords never returned in API responses
   
2. **SQL Injection Prevention**
   - ✅ All queries use parameterized statements ($1, $2, etc.)
   - ✅ NEVER string concatenation with user input
   
3. **Database Design**
   - ✅ Proper primary key (work_email)
   - ✅ Performance indexes on frequently queried columns
   - ✅ Audit columns (created_at, updated_at, last_login)
   - ✅ Soft delete with is_active flag
   
4. **Input Validation**
   - ✅ Email format validation
   - ✅ Required field checks
   - ✅ Role whitelist validation
   - ✅ Minimum password length
   
5. **Error Handling**
   - ✅ Generic error messages to clients
   - ✅ Detailed logging on server
   - ✅ No exposure of sensitive information

---

## 🚀 Quick Start Commands

### Initial Setup (One-time)

```powershell
# 1. Create database
psql -U postgres -c "CREATE DATABASE user_management_db;"

# 2. Run schema
cd d:\Hackathons\ggw-oodo-x-amalthea\backend
psql -U postgres -d user_management_db -f database/schema.sql

# 3. Install dependencies
npm install

# 4. Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL password
```

### Daily Development

```powershell
# Start development server (auto-restart on changes)
npm run dev
```

### Test Your API

```powershell
# Register a user
$body = @{
    firstName = "Test"
    lastName = "User"
    workEmail = "test@example.com"
    role = "user"
    password = "Password123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
    -Method POST -Body $body -ContentType "application/json"

# Login
$body = @{
    workEmail = "test@example.com"
    password = "Password123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" `
    -Method POST -Body $body -ContentType "application/json"
```

---

## 📊 Database Schema Explained

```sql
CREATE TABLE users (
    -- Primary Key: Email is unique identifier
    work_email VARCHAR(255) PRIMARY KEY,
    
    -- User data
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    
    -- Security: ONLY store hashed passwords
    password_hash VARCHAR(255) NOT NULL,
    
    -- Audit trail: Track when things happen
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete: Mark inactive instead of deleting
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints: Enforce data quality at database level
    CONSTRAINT email_format CHECK (work_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT role_check CHECK (role IN ('admin', 'manager', 'user', 'guest'))
);

-- Indexes: Speed up common queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_name ON users(last_name);
```

### Why This Design?

1. **Email as Primary Key**: Natural, unique identifier
2. **VARCHAR(255)**: Standard email length limit
3. **NOT NULL**: Enforce required fields at database level
4. **TIMESTAMP WITH TIME ZONE**: Store timezone-aware timestamps
5. **CHECK Constraints**: Database-level validation (data integrity)
6. **Indexes**: Fast lookups on common query fields
7. **is_active**: Soft delete preserves data for audit/recovery

---

## 🎯 Key Concepts for Students

### 1. Connection Pooling (Why It Matters)

```javascript
// ❌ BAD: Create new connection for each query
const client = new Client();
await client.connect();
await client.query('SELECT * FROM users');
await client.end();

// ✅ GOOD: Use connection pool
const pool = new Pool();
await pool.query('SELECT * FROM users');
// Connection automatically returned to pool
```

**Why?** Creating connections is expensive. Pools reuse connections = better performance.

### 2. Parameterized Queries (Prevent SQL Injection)

```javascript
// ❌ DANGEROUS: SQL Injection vulnerability
const email = req.body.email;
await query(`SELECT * FROM users WHERE work_email = '${email}'`);
// If email = "' OR '1'='1", you just leaked all users!

// ✅ SAFE: Parameterized query
await query('SELECT * FROM users WHERE work_email = $1', [email]);
// PostgreSQL treats input as DATA, not CODE
```

### 3. Password Hashing (Never Store Plain Text)

```javascript
// ❌ NEVER DO THIS
const password = req.body.password;
await query('INSERT INTO users (password) VALUES ($1)', [password]);

// ✅ ALWAYS HASH
const passwordHash = await bcrypt.hash(password, 12);
await query('INSERT INTO users (password_hash) VALUES ($1)', [passwordHash]);
```

**Why?** If your database is compromised, hashed passwords can't be reversed.

### 4. Soft Delete (Don't Lose Data)

```javascript
// ❌ Hard delete: Data is gone forever
await query('DELETE FROM users WHERE email = $1', [email]);

// ✅ Soft delete: Just mark as inactive
await query('UPDATE users SET is_active = FALSE WHERE email = $1', [email]);
```

**Why?** Compliance, audit trails, data recovery, analytics.

---

## 🛠️ Common Issues & Solutions

### Issue: "password authentication failed"
**Solution**: Check credentials in `.env` file match PostgreSQL user

### Issue: "EADDRINUSE: port already in use"
**Solution**: Change PORT in `.env` or kill process using port 5000

### Issue: "bcrypt installation failed"
**Solution**: 
```powershell
npm install --global windows-build-tools
npm rebuild bcrypt --build-from-source
```

### Issue: "relation 'users' does not exist"
**Solution**: Run the schema file:
```powershell
psql -U postgres -d user_management_db -f database/schema.sql
```

---

## 📚 What to Learn Next

### For This Project
1. **JWT Authentication** - Token-based auth (more scalable)
2. **Rate Limiting** - Prevent abuse/DDoS
3. **Email Verification** - Verify user emails
4. **Unit Testing** - Jest + Supertest
5. **Docker** - Containerize your app

### Database Skills
1. **Transactions** - Multiple queries as one atomic operation
2. **Indexes** - When and how to create them
3. **Migrations** - Version control for database schema
4. **Query Optimization** - Make queries faster
5. **Backup/Recovery** - Don't lose data

### Node.js Skills
1. **Async/Await** - Modern asynchronous JavaScript
2. **Error Handling** - Try/catch, error middleware
3. **Environment Variables** - Configuration management
4. **Middleware** - How Express middleware works
5. **REST API Design** - Best practices

---

## 💡 Pro Tips from a Senior DBA

1. **Always use transactions for multi-step operations**
   ```javascript
   const client = await pool.connect();
   try {
       await client.query('BEGIN');
       await client.query('UPDATE users SET ...');
       await client.query('INSERT INTO audit_log ...');
       await client.query('COMMIT');
   } catch (e) {
       await client.query('ROLLBACK');
       throw e;
   } finally {
       client.release();
   }
   ```

2. **Monitor slow queries**
   - Any query over 1 second needs optimization
   - Use `EXPLAIN ANALYZE` to understand query plans
   - Add indexes for common WHERE/JOIN columns

3. **Never trust user input**
   - Validate on frontend (user experience)
   - Validate on backend (security)
   - Validate at database (data integrity)

4. **Plan for scale early**
   - Connection pooling (done ✅)
   - Indexes on foreign keys (done ✅)
   - Read replicas for high traffic
   - Cache frequently accessed data (Redis)

5. **Test disaster scenarios**
   - What if database goes down?
   - What if connection pool exhausted?
   - What if disk is full?
   - Always have a recovery plan

---

## ✅ Checklist Before Deploying to Production

- [ ] All environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups scheduled
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring set up (Sentry, Rollbar)
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Emergency rollback plan ready

---

## 🎓 Learning Resources

### PostgreSQL
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

### Node.js/Express
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Questions?** Review the comprehensive [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

**Need API details?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint reference.

---

*Built with industry best practices by a Senior Database Administrator*

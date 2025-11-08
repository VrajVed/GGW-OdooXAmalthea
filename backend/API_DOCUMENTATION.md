# API Documentation - User Management System

## Base URL
```
http://localhost:5000/api
```

---

## 📍 Endpoints

### 1. Health Check
**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T10:30:00.000Z",
  "uptime": 1234.567
}
```

---

### 2. Register User
**POST** `/api/users/register`

Create a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "workEmail": "john.doe@company.com",
  "role": "user",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**
- `firstName` (required): User's first name
- `lastName` (required): User's last name
- `workEmail` (required): Valid email format, must be unique
- `role` (optional): One of: `admin`, `manager`, `user`, `guest` (default: `user`)
- `password` (required): Minimum 8 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "work_email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2025-11-08T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid data
- `409`: Email already exists
- `500`: Server error

---

### 3. Login
**POST** `/api/users/login`

Authenticate a user.

**Request Body:**
```json
{
  "workEmail": "john.doe@company.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "work_email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true
    }
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account deactivated
- `500`: Server error

---

### 4. Get All Users
**GET** `/api/users`

Retrieve all users (passwords excluded).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "work_email": "john.doe@company.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "user",
        "created_at": "2025-11-08T10:30:00.000Z",
        "last_login": "2025-11-08T11:00:00.000Z",
        "is_active": true
      }
    ],
    "count": 1
  }
}
```

---

### 5. Get User by Email
**GET** `/api/users/:email`

Retrieve a specific user by email.

**Parameters:**
- `email` (path): User's work email

**Example:**
```
GET /api/users/john.doe@company.com
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "work_email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2025-11-08T10:30:00.000Z",
      "last_login": "2025-11-08T11:00:00.000Z",
      "is_active": true
    }
  }
}
```

**Error Responses:**
- `404`: User not found
- `500`: Server error

---

### 6. Update User
**PUT** `/api/users/:email`

Update user information.

**Parameters:**
- `email` (path): User's work email

**Request Body (all fields optional):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "manager"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "work_email": "john.doe@company.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "manager",
      "updated_at": "2025-11-08T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Invalid data or no fields to update
- `404`: User not found
- `500`: Server error

---

### 7. Delete User (Soft Delete)
**DELETE** `/api/users/:email`

Deactivate a user account (soft delete).

**Parameters:**
- `email` (path): User's work email

**Example:**
```
DELETE /api/users/john.doe@company.com
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

**Error Responses:**
- `404`: User not found
- `500`: Server error

---

## 🔒 Security Features

### Password Hashing
- Passwords are hashed using **bcrypt** with cost factor 12
- Original passwords are never stored or returned
- Industry-standard cryptographic algorithm

### SQL Injection Prevention
- All queries use parameterized statements
- User input is never concatenated into SQL queries

### Input Validation
- Email format validation using regex
- Role validation against whitelist
- Password strength requirements
- Required field checks

### Error Handling
- Generic error messages to clients
- Detailed logging on server side
- No exposure of internal system details

---

## 📊 Database Schema

```sql
CREATE TABLE users (
    work_email VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Indexes
- Primary key on `work_email`
- Index on `role` for role-based queries
- Index on `is_active` for filtering active users
- Index on `last_name` for name searches

---

## 🧪 Testing Examples

### PowerShell Examples

#### Register User
```powershell
$body = @{
    firstName = "Alice"
    lastName = "Johnson"
    workEmail = "alice.johnson@company.com"
    role = "manager"
    password = "StrongPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

#### Login
```powershell
$body = @{
    workEmail = "alice.johnson@company.com"
    password = "StrongPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### cURL Examples (Git Bash or WSL)

#### Register User
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Smith",
    "workEmail": "bob.smith@company.com",
    "role": "user",
    "password": "SecurePass456!"
  }'
```

#### Get All Users
```bash
curl http://localhost:5000/api/users
```

---

## 🚀 Quick Start

1. Install PostgreSQL and create database
2. Run schema.sql to create tables
3. Configure .env file
4. Install dependencies: `npm install`
5. Start server: `npm run dev`
6. Test endpoints using examples above

---

## 📝 Common HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (e.g., email exists)
- **500 Internal Server Error**: Server error

---

## 🔗 Related Files

- Setup Guide: `SETUP_GUIDE.md`
- Database Schema: `database/schema.sql`
- Server Configuration: `server.js`
- User Routes: `routes/users.js`
- Database Config: `config/database.js`

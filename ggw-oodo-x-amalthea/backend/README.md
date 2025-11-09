# User Management Backend

A production-grade Node.js/Express backend with PostgreSQL for secure user management and authentication.

## 🎯 Features

- ✅ **Secure Authentication**: Password hashing with bcrypt (cost factor 12)
- ✅ **PostgreSQL Database**: Production-ready schema with indexes and triggers
- ✅ **RESTful API**: Clean, well-documented endpoints
- ✅ **Input Validation**: Email format, password strength, role validation
- ✅ **SQL Injection Prevention**: Parameterized queries throughout
- ✅ **Connection Pooling**: Optimized database connection management
- ✅ **Error Handling**: Proper error responses without exposing internals
- ✅ **Security Headers**: Helmet middleware for HTTP security
- ✅ **CORS Support**: Configurable cross-origin resource sharing
- ✅ **Request Logging**: Morgan middleware for HTTP request logging
- ✅ **Graceful Shutdown**: Proper cleanup of resources on exit

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection configuration
├── database/
│   └── schema.sql           # Database schema with best practices
├── routes/
│   └── users.js             # User management routes
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
├── server.js                # Express server entry point
├── API_DOCUMENTATION.md     # Complete API reference
├── SETUP_GUIDE.md           # Detailed setup instructions
└── README.md                # This file
```

## 🚀 Quick Start

### 1. Install PostgreSQL

Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```powershell
psql -U postgres
```

```sql
CREATE DATABASE user_management_db;
\q
```

### 3. Run Schema

```powershell
# Make sure to set DB_NAME in your .env file first
psql -U postgres -d user_management_db -f database/oneflow-schema.sql
```

### 4. Install Dependencies

```powershell
npm install
```

### 5. Configure Environment

```powershell
copy .env.example .env
notepad .env
```

Update database credentials in `.env`

### 6. Start Server

```powershell
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation and configuration guide
- **[API Documentation](API_DOCUMENTATION.md)** - Endpoint reference with examples

## 🔒 Security Best Practices

### Implemented
- Password hashing with bcrypt
- Parameterized SQL queries (prevents SQL injection)
- Input validation and sanitization
- Security headers via Helmet
- Environment variable configuration
- Soft delete (account deactivation)
- Error handling without exposing internals

### Recommended for Production
- JWT token-based authentication
- Rate limiting (express-rate-limit)
- HTTPS/SSL certificates
- Email verification
- Two-factor authentication (2FA)
- Password reset functionality
- Session management
- API key authentication

## 📊 Database Schema

```sql
users
├── work_email (PK)      VARCHAR(255)
├── first_name           VARCHAR(100)
├── last_name            VARCHAR(100)
├── role                 VARCHAR(50)
├── password_hash        VARCHAR(255)
├── created_at           TIMESTAMP
├── updated_at           TIMESTAMP
├── last_login           TIMESTAMP
└── is_active            BOOLEAN
```

## 🛠️ Technologies

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client for Node.js
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger
- **dotenv** - Environment configuration

## 📝 Available Scripts

```powershell
npm start       # Start production server
npm run dev     # Start development server with auto-restart
npm run db:setup # Run database schema setup
```

## 🧪 Testing the API

### Register a User

```powershell
$body = @{
    firstName = "John"
    lastName = "Doe"
    workEmail = "john.doe@company.com"
    role = "user"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
    -Method POST -Body $body -ContentType "application/json"
```

### Login

```powershell
$body = @{
    workEmail = "john.doe@company.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" `
    -Method POST -Body $body -ContentType "application/json"
```

## 🔧 Troubleshooting

### Database Connection Failed
- Check PostgreSQL service is running
- Verify credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Or kill process: `netstat -ano | findstr ":5000"`

### bcrypt Installation Issues
```powershell
npm install --global windows-build-tools
npm rebuild bcrypt --build-from-source
```

## 📈 Next Steps

1. Implement JWT authentication
2. Add rate limiting
3. Set up email service
4. Add password reset
5. Write unit tests
6. Set up CI/CD pipeline
7. Deploy to cloud (AWS, Azure, Heroku)

## 📄 License

ISC

## 👤 Author

Created by a Senior Database Administrator with 30+ years of experience

---

**Need detailed instructions?** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Need API reference?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

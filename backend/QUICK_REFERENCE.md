# 🚀 Quick Reference Card - PostgreSQL + Node.js

## 📦 Installation Commands

```powershell
# 1. Create Database
psql -U postgres -c "CREATE DATABASE user_management_db;"

# 2. Run Schema
cd d:\Hackathons\ggw-oodo-x-amalthea\backend
psql -U postgres -d user_management_db -f database/schema.sql

# 3. Install Dependencies
npm install

# 4. Setup Environment
copy .env.example .env
# Edit .env with your PostgreSQL password

# 5. Start Server
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| **POST** | `/api/users/register` | firstName, lastName, workEmail, role, password | Register new user |
| **POST** | `/api/users/login` | workEmail, password | Login user |
| **GET** | `/api/users` | - | Get all users |
| **GET** | `/api/users/:email` | - | Get user by email |
| **PUT** | `/api/users/:email` | firstName, lastName, role | Update user |
| **DELETE** | `/api/users/:email` | - | Deactivate user |
| **GET** | `/health` | - | Health check |

---

## 🧪 Quick Test Commands

### Register User
```powershell
$body = @{ firstName = "John"; lastName = "Doe"; workEmail = "john@test.com"; role = "user"; password = "Pass123!" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" -Method POST -Body $body -ContentType "application/json"
```

### Login
```powershell
$body = @{ workEmail = "john@test.com"; password = "Pass123!" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" -Method POST -Body $body -ContentType "application/json"
```

### Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Method GET
```

---

## 💾 Database Commands

```powershell
# Connect to database
psql -U postgres -d user_management_db

# View all tables
\dt

# View table structure
\d users

# Query users
SELECT * FROM users;

# Count users
SELECT COUNT(*) FROM users;

# Exit
\q
```

---

## 📁 File Structure

```
backend/
├── config/database.js        ← DB connection
├── routes/users.js           ← API routes
├── database/schema.sql       ← DB schema
├── server.js                 ← Entry point
├── .env                      ← Config (create this!)
└── package.json              ← Dependencies
```

---

## 🔒 Security Checklist

- ✅ Passwords hashed (bcrypt cost 12)
- ✅ Parameterized SQL queries
- ✅ Input validation
- ✅ Environment variables
- ✅ Error handling
- ✅ Security headers (helmet)
- ✅ CORS enabled
- ✅ Soft delete (is_active)

---

## ⚡ Common Commands

```powershell
# Start development server
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# Check PostgreSQL service
Get-Service -Name postgresql*

# Kill process on port 5000
netstat -ano | findstr ":5000"
taskkill /PID <PID> /F
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "password authentication failed" | Update `.env` with correct password |
| "port already in use" | Change PORT in `.env` or kill process |
| "bcrypt installation failed" | `npm rebuild bcrypt --build-from-source` |
| "relation 'users' does not exist" | Run schema.sql again |
| Server won't start | Check PostgreSQL is running |

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

---

## 🔑 Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SETUP_GUIDE.md` | Complete setup instructions |
| `API_DOCUMENTATION.md` | API reference |
| `STUDENT_GUIDE.md` | Learning concepts |
| `ARCHITECTURE.md` | System diagrams |
| `SUMMARY.md` | Overview |

---

## 🎯 Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create database
3. ✅ Run schema
4. ✅ Install npm packages
5. ✅ Configure .env
6. ✅ Start server
7. ✅ Test endpoints
8. 🔄 Connect frontend

---

## 💡 Pro Tips

**Connection Pooling**: Use pools, not individual connections (10x faster!)

**Parameterized Queries**: Always use $1, $2, etc. (prevents SQL injection)

**Password Hashing**: Never store plain text (use bcrypt with cost 12+)

**Soft Delete**: Mark inactive instead of deleting (use is_active flag)

**Audit Trail**: Always track created_at, updated_at, last_login

---

## 📞 Quick Help

**Database not working?**
```powershell
Get-Service -Name postgresql* | Start-Service
```

**Server not starting?**
```powershell
npm install
npm run dev
```

**Can't connect?**
- Check `.env` has correct password
- Verify PostgreSQL is running
- Ensure database exists

---

## 🌟 Success Indicators

✅ Server starts without errors
✅ Can register user
✅ Can login
✅ Password is hashed in database
✅ Can retrieve users
✅ Can update user info

---

**Print this card for quick reference!** 📄

For detailed instructions, see **SETUP_GUIDE.md**

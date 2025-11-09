# GGW Odoo x Amalthea - Project Management System

A full-stack project management application with Kanban board, built with React + Vite frontend and Node.js + Express + PostgreSQL backend.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL 18.0
- npm >= 9.0.0

### Backend Setup

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Environment Configuration**
   - The `.env` file is already configured with:
     - Database: `user_management_db` (configurable via DB_NAME)
     - User: `postgres`
     - Password: `root`
     - Port: `5000`

4. **Database is already set up with:**
   - ✅ Database created (name from DB_NAME env variable)
   - ✅ Schema loaded (6 schemas: auth, catalog, project, finance, ops, analytics)
   - ✅ Sample data loaded (1 org, 1 user, 5 projects)

5. **Start the server**
   ```powershell
   npm start          # Production mode
   npm run dev        # Development mode with nodemon
   ```

   Server will run on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```powershell
   cd frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Start the development server**
   ```powershell
   npm run dev
   ```

   Frontend will run on: `http://localhost:5173`

## 📊 Database Management

### Available Scripts

```powershell
npm run db:create    # Create the database
npm run db:drop      # Drop the database
npm run db:setup     # Load schema
npm run db:seed      # Load sample data
npm run db:reset     # Drop, create, setup, and seed (full reset)
```

### Database Schema

The application uses a multi-tenant ERP schema with:

**Schemas:**
- `auth` - Authentication & organizations
- `catalog` - Master data (currencies, partners, products)
- `project` - Project & task management
- `finance` - Invoices, bills, orders
- `ops` - Timesheets, expenses
- `analytics` - Materialized views for reporting

**Key Tables:**
- `auth.orgs` - Organizations
- `auth.users` - User accounts
- `project.projects` - Projects with Kanban statuses
- `project.tasks` - Tasks and subtasks
- `project.timesheets` - Time tracking

### Sample Data

The database is pre-loaded with:
- **1 Organization**: GGW Organization
- **1 User**: admin@ggw.com (password: admin123)
- **5 Projects**:
  - Website Redesign (New)
  - Mobile App Development (In Progress - 45%)
  - Database Migration (In Progress - 75%)
  - Security Audit (Completed - 100%)
  - API Integration (New)

## 🎨 Features

### Projects Page (Kanban Board)
- ✅ Three status columns: New, In Progress, Completed
- ✅ Drag-and-drop (localStorage for now, API-ready)
- ✅ Create/Edit/Delete projects
- ✅ Progress tracking with visual progress bars
- ✅ Search and sort functionality
- ✅ Manager assignment
- ✅ Tags and categorization
- ✅ Due date tracking
- ✅ Real-time localStorage persistence
- ✅ Backend API integration ready

### API Endpoints

**Projects:**
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Soft delete project

**Users:**
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users` - List users

**File Upload:**
- `POST /api/upload` - Upload files (multer)

## 🔧 Technology Stack

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js
- Express 4.18
- PostgreSQL 18.0
- pg (node-postgres) 8.11
- bcrypt (password hashing)
- multer (file uploads)
- helmet (security)
- morgan (logging)
- cors

## 📁 Project Structure

```
GGW-OdooXAmalthea/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── database/
│   │   ├── oneflow-schema.sql   # Complete ERP schema
│   │   └── seed-data.sql        # Sample data
│   ├── routes/
│   │   ├── users.js             # User authentication
│   │   ├── projects.js          # Project CRUD
│   │   └── upload.js            # File upload
│   ├── .env                     # Environment variables
│   ├── server.js                # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectModal.jsx
│   │   │   └── ProjectDetails.jsx
│   │   ├── pages/
│   │   │   ├── ProjectsPage.jsx    # Kanban board
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── api.js               # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md                    # This file
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Node Environment
NODE_ENV=development

# Server
PORT=5000
HOST=0.0.0.0

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management_db
DB_USER=postgres
DB_PASSWORD=root

# Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

## 🎯 Current Status

### ✅ Completed
- Backend server running with PostgreSQL connection
- Database schema loaded with 6 schemas
- Sample data loaded (org, user, projects)
- Projects API endpoints functional
- Frontend Kanban board with localStorage
- Create/Edit/Delete projects in UI
- Progress tracking and visualization
- Search and sort functionality
- Responsive design

### 🔄 Integration Status
- Backend: **READY** ✅
- Database: **CONFIGURED** ✅
- Frontend: **USING LOCALSTORAGE** (API integration ready)

### 📝 Next Steps
1. Connect frontend to backend API (replace localStorage with API calls)
2. Add authentication flow
3. Implement real-time updates (WebSockets)
4. Add file upload for project attachments
5. Implement task management within projects

## 🧪 Testing the Setup

### Test Database Connection
```powershell
# Use the database name from your .env file
psql -U postgres -d user_management_db -c "SELECT name, status, progress_pct FROM project.projects;"
```

### Test Backend API
```powershell
# Health check
curl http://localhost:5000/health

# Get projects
curl http://localhost:5000/api/projects
```

### Access Frontend
Open browser: `http://localhost:5173`
Navigate to: Projects page (Kanban board)

## 🛠️ Troubleshooting

### Port Already in Use
If port 5000 is busy, change `PORT` in `backend/.env` to another port (e.g., 5001)

### Database Connection Failed
1. Verify PostgreSQL is running
2. Check credentials in `backend/.env`
3. Ensure database exists: `psql -U postgres -l`

### Frontend Not Connecting
1. Verify backend is running on port 5000
2. Check CORS settings in `backend/server.js`
3. Update `VITE_API_URL` in `frontend/.env` if needed

## 📞 Support

For issues or questions, please check the codebase or contact the development team.

## youtube link

[https://www.kapwing.com/w/rjFr5a5_AE](https://www.kapwing.com/w/rjFr5a5_AE)

---

**Status**: ✅ Production-Ready Backend | 🔄 Frontend Integration Pending
**Last Updated**: November 8, 2025

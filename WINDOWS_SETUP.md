# 🪟 Windows Setup Guide - Multitenant Inventory System

Complete step-by-step guide to set up and run the system on Windows using PowerShell or Command Prompt.

---

## 📋 Prerequisites

### 1. Install Required Software

#### Node.js (v16 or higher)
1. Download from: https://nodejs.org/
2. Run installer and follow prompts
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

#### PostgreSQL
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. **When prompted to choose installation type, select "Standard"** (this is the standard PostgreSQL distribution suitable for this application)
   - Enterprise: Commercial features (not needed)
   - **Standard: Recommended for this project** ✅
   - Postgres Distributed: For multi-node setups (not needed)
   - WarehousePG: For data warehousing (not needed)
4. **Installation Directory:** Accept the default location (usually `C:\Program Files\PostgreSQL\<version>`)
   - The default path is fine for most users
   - You can change it if you prefer, but make sure there are no spaces in the path if you do
5. Remember the postgres user password you set
6. Verify installation:
   ```powershell
   psql --version
   ```

#### Git (Optional but recommended)
1. Download from: https://git-scm.com/download/win
2. Run installer

#### PostgreSQL Client Tools (if not included)
- Make sure `pg_dump` and `psql` are in your PATH
- Usually installed with PostgreSQL

---

## 🗄️ Step 1: Database Setup

### 1.1 Create Database

Open **Command Prompt** or **PowerShell** as Administrator:

```powershell
# Connect to PostgreSQL (disable SSL for local connections)
psql -U postgres -h localhost --set=sslmode=disable

# Create database
CREATE DATABASE inventory_system;

# Exit psql
\q
```

**OR** using PowerShell directly:

```powershell
# Set PostgreSQL password
$env:PGPASSWORD = "your_postgres_password"

# Create database (disable SSL for local connections)
psql -U postgres -h localhost --set=sslmode=disable -c "CREATE DATABASE inventory_system;"
```

**If you get SSL errors**, use one of these methods:

**Method 1: Disable SSL in connection string**
```powershell
psql "postgresql://postgres:your_password@localhost:5432/postgres?sslmode=disable"
```

**Method 2: Set environment variable**
```powershell
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost
```

**Method 3: Use connection parameter**
```powershell
psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;" --set=sslmode=disable
```

### 1.2 Run Database Migrations

```powershell
# Navigate to project directory
cd C:\Users\Admin\Desktop\imas

# Set PostgreSQL password (if not already set)
$env:PGPASSWORD = "your_postgres_password"

# Run SQL migration file (disable SSL for local connections)
# If psql is not in PATH, use full path:
# & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d inventory_system --set=sslmode=disable -f backend\src\database\migrations\001_create_tables.sql

psql -U postgres -h localhost -d inventory_system --set=sslmode=disable -f backend\src\database\migrations\001_create_tables.sql
```

**Alternative if SSL errors persist:**
```powershell
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

**If you get "psql: command not found" or "psql is not recognized":**

This means PostgreSQL's `bin` directory is not in your PATH. Here are quick fixes:

**Quick Fix (Current Session Only):**
```powershell
# Replace 18 with your PostgreSQL version (12, 13, 14, 15, 16, 17, 18, etc.)
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"
psql --version  # Test it
```

**Permanent Fix:**
1. Open Environment Variables (Win+R → `sysdm.cpl` → Environment Variables)
2. Edit "Path" under User variables
3. Add: `C:\Program Files\PostgreSQL\16\bin` (replace 16 with your version)
4. Restart PowerShell

**Or use full path directly:**
```powershell
# For PostgreSQL 18 (adjust version number if different)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost --set=sslmode=disable -c "CREATE DATABASE inventory_system;"
```

**See POSTGRESQL_SETUP_FIX.md for detailed troubleshooting.**

---

## ⚙️ Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```powershell
cd C:\Users\Admin\Desktop\imas\backend
```

### 2.2 Install Dependencies

```powershell
npm install
```

This will install all required packages (may take a few minutes).

**If you encounter Puppeteer installation errors**, use the Windows-specific install script:
```powershell
npm run install:win
```

Or see the [Puppeteer Installation Errors](#puppeteer-installation-errors) section in Troubleshooting for more details.

### 2.3 Configure Environment Variables

Create `.env` file in `backend` directory:

```powershell
# Create .env file
New-Item -Path .env -ItemType File -Force

# Edit .env file (use Notepad or your editor)
notepad .env
```

**Copy this content to `.env`:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_system
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_12345
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary (for image uploads - Optional for now)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (Optional - for receipt PDFs)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@inventorysystem.com

# SuperAdmin
SUPERADMIN_EMAIL=admin@inventorysystem.com
SUPERADMIN_PASSWORD=ChangeThisPassword123!

# Application URLs
FRONTEND_URL=http://localhost:3000
SUPERADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:5000
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

### 2.4 Create Uploads Directory

```powershell
# Create directory for file uploads
New-Item -Path "uploads\receipts" -ItemType Directory -Force
New-Item -Path "logs" -ItemType Directory -Force
```

### 2.5 Seed Initial Data (Create SuperAdmin)

```powershell
# Run seed script
node src\database\seeds\run.js
```

This creates the initial SuperAdmin account.

### 2.6 Start Backend Server

```powershell
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

**You should see:**
```
✅ Database connection established successfully.
🚀 Server running on port 5000
📝 Environment: development
```

**Keep this terminal window open!**

---

## 🎨 Step 3: Frontend Web App Setup

### 3.1 Open New Terminal Window

Open a **new PowerShell/Command Prompt window** (keep backend running).

### 3.2 Navigate to Frontend

```powershell
cd C:\Users\Admin\Desktop\imas\frontend\web-app
```

### 3.3 Install Dependencies

```powershell
npm install
```

### 3.4 Start Frontend

```powershell
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
```

**Keep this terminal window open!**

---

## 👑 Step 4: SuperAdmin Portal Setup

### 4.1 Open Another New Terminal Window

Open a **third PowerShell/Command Prompt window**.

### 4.2 Navigate to SuperAdmin Portal

```powershell
cd C:\Users\Admin\Desktop\imas\frontend\superadmin-portal
```

### 4.3 Install Dependencies

```powershell
npm install
```

### 4.4 Start SuperAdmin Portal

```powershell
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3001/
```

---

## ✅ Step 5: Verify Everything is Running

You should now have **3 terminal windows** running:

1. **Backend** - Port 5000
2. **Web App** - Port 3000
3. **SuperAdmin Portal** - Port 3001

### Test the System

1. **Backend Health Check:**
   ```powershell
   # In a new terminal
   curl http://localhost:5000/health
   ```
   Or open in browser: http://localhost:5000/health

2. **Web App:**
   Open browser: http://localhost:3000

3. **SuperAdmin Portal:**
   Open browser: http://localhost:3001

---

## 🔐 Step 6: First Login

### SuperAdmin Login

1. Go to: http://localhost:3001/login
2. Email: `admin@inventorysystem.com`
3. Password: `ChangeThisPassword123!` (or what you set in .env)

### Create Your First Tenant

1. After SuperAdmin login, go to "Tenants"
2. Click "Create Tenant"
3. Fill in:
   - Name: Your Company Name
   - Subdomain: yourcompany (unique)
   - Plan Type: Free
   - Max Users: 5

### Register as Tenant Admin

1. Go to: http://localhost:3000/register
2. Fill in registration form
3. This creates a tenant and admin user

---

## 🚀 Quick Start Script (PowerShell)

Create a file `start-all.ps1` in project root:

```powershell
# start-all.ps1
Write-Host "Starting Multitenant Inventory System..." -ForegroundColor Green

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start Web App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend\web-app; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start SuperAdmin Portal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend\superadmin-portal; npm run dev"

Write-Host "All services starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "SuperAdmin: http://localhost:3001" -ForegroundColor Cyan
```

**Run it:**
```powershell
.\start-all.ps1
```

---

## 🛑 Stopping the System

To stop all services:

1. Close all terminal windows, OR
2. Press `Ctrl+C` in each terminal window

---

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" error:

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### PostgreSQL Connection Issues

**SSL Connection Errors:**

If you get: `error: connection to server at "localhost" (::1), port 5432 failed: server does not support SSL, but SSL was required`

**Solution: Disable SSL for local connections**

```powershell
# Method 1: Set environment variable (recommended)
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost

# Method 2: Use connection parameter
psql -U postgres -h localhost --set=sslmode=disable

# Method 3: Use connection string
psql "postgresql://postgres:your_password@localhost:5432/postgres?sslmode=disable"
```

**General Connection Issues:**

```powershell
# Test PostgreSQL connection
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost -d inventory_system

# If connection fails, check:
# 1. PostgreSQL service is running
# 2. Password in .env is correct
# 3. Database exists
# 4. Use -h localhost and disable SSL for local connections
```

### Module Not Found Errors

```powershell
# Delete node_modules and reinstall
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

### Puppeteer Installation Errors

If you encounter errors during `npm install` related to Puppeteer (Chrome download failures):

**Solution 1: Clean cache and install with skip flag (Recommended)**
```powershell
# Clean corrupted Puppeteer cache
Remove-Item -Path "$env:USERPROFILE\.cache\puppeteer" -Recurse -Force -ErrorAction SilentlyContinue

# Install with Puppeteer download skipped
cd backend
$env:PUPPETEER_SKIP_DOWNLOAD='true'
npm install
```

**Note:** The `.npmrc` file in the `backend` directory is already configured to skip Puppeteer downloads. If you still encounter issues, Chrome will be downloaded automatically on first use when generating PDFs.

**Solution 2: If errors persist, manually clean and reinstall**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Path "$env:USERPROFILE\.cache\puppeteer" -Recurse -Force -ErrorAction SilentlyContinue
$env:PUPPETEER_SKIP_DOWNLOAD='true'
npm install
```

### Permission Errors

Run PowerShell/Command Prompt as **Administrator** if you get permission errors.

### Database Migration Errors

```powershell
# Check if tables exist
psql -U postgres -d inventory_system -c "\dt"

# If tables don't exist, run migration again
psql -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

---

## 📝 Common Commands Reference

### Backend Commands
```powershell
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm start            # Start production server
npm run migrate      # Run migrations (if implemented)
npm run seed         # Seed initial data
```

### Frontend Commands
```powershell
cd frontend\web-app
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

### SuperAdmin Portal Commands
```powershell
cd frontend\superadmin-portal
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

### Database Commands
```powershell
# Connect to database
psql -U postgres -d inventory_system

# List all tables
psql -U postgres -d inventory_system -c "\dt"

# Check tenants
psql -U postgres -d inventory_system -c "SELECT * FROM tenants;"

# Check users
psql -U postgres -d inventory_system -c "SELECT email, role FROM users;"
```

---

## 🎯 Next Steps

1. ✅ System is running
2. ✅ Login as SuperAdmin
3. ✅ Create your first tenant
4. ✅ Register as tenant admin
5. ✅ Start using the system!

---

## 📚 Additional Resources

- Backend API: http://localhost:5000
- Web App: http://localhost:3000
- SuperAdmin Portal: http://localhost:3001
- Health Check: http://localhost:5000/health

---

## ⚠️ Important Notes

1. **Keep all terminal windows open** while using the system
2. **Change default passwords** after first login
3. **Backup your database** regularly
4. **Don't commit `.env` file** to version control
5. **Use strong JWT secrets** in production

---

**Need Help?** Check the main README.md or create an issue in the repository.


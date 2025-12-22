# ⚡ Quick Start Guide - Windows

Fastest way to get the system running on Windows.

## 🚀 One-Command Setup (After Prerequisites)

### Prerequisites First:
1. ✅ Install Node.js (v16+)
2. ✅ Install PostgreSQL
3. ✅ Create database: `inventory_system`

### Then Run:

```powershell
# Navigate to project
cd C:\Users\Admin\Desktop\imas

# Run the start script
.\start-all.ps1
```

That's it! The script will:
- ✅ Start Backend (Port 5000)
- ✅ Start Web App (Port 3000)  
- ✅ Start SuperAdmin Portal (Port 3001)

---

## 📋 Manual Setup (Step by Step)

### 1. Database Setup (One Time)

```powershell
# Create database
psql -U postgres -c "CREATE DATABASE inventory_system;"

# Run migrations
psql -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

### 2. Backend Setup

```powershell
cd backend
npm install
# Edit .env file with your database password
notepad .env
# Seed SuperAdmin
node src\database\seeds\run.js
# Start server
npm run dev
```

### 3. Frontend Setup (New Terminal)

```powershell
cd frontend\web-app
npm install
npm run dev
```

### 4. SuperAdmin Portal (New Terminal)

```powershell
cd frontend\superadmin-portal
npm install
npm run dev
```

---

## 🔐 First Login

1. Open: http://localhost:3001
2. Login with:
   - Email: `admin@inventorysystem.com`
   - Password: `ChangeThisPassword123!`

---

## 🛑 Stop All Services

```powershell
.\stop-all.ps1
```

Or close all terminal windows manually.

---

## ❓ Troubleshooting

**Port in use?**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Database connection error?**
- Check PostgreSQL is running
- Verify password in `.env` file
- Ensure database exists

**Module not found?**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

For detailed instructions, see `WINDOWS_SETUP.md`


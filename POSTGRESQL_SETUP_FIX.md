# 🔧 Fixing PostgreSQL PATH Issue

## Problem
You're getting this error:
```
psql : The term 'psql' is not recognized...
```

This means PostgreSQL's `bin` directory is not in your system PATH.

---

## ✅ Solution Options

### Option 1: Install PostgreSQL (If Not Installed)

If PostgreSQL is not installed yet:

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer (usually 64-bit version)

2. **Run the Installer:**
   - Choose **"Standard"** installation type
   - Accept default installation directory: `C:\Program Files\PostgreSQL\<version>`
   - **IMPORTANT:** During installation, check the box that says:
     - ✅ **"Add PostgreSQL bin directory to PATH"** or
     - ✅ **"Command Line Tools"**
   - Remember the password you set for the `postgres` user

3. **Verify Installation:**
   ```powershell
   # Close and reopen PowerShell, then:
   psql --version
   ```

---

### Option 2: Add PostgreSQL to PATH (If Already Installed)

If PostgreSQL is installed but not in PATH:

#### Method A: Using PowerShell (Temporary - Current Session Only)

1. **Find your PostgreSQL bin directory:**
   - Usually: `C:\Program Files\PostgreSQL\16\bin`
   - Or: `C:\Program Files\PostgreSQL\15\bin`
   - Replace `16` or `15` with your PostgreSQL version number

2. **Add to PATH for current session:**
   ```powershell
   # Replace 16 with your PostgreSQL version
   $env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
   
   # Test it
   psql --version
   ```

#### Method B: Add Permanently via System Settings

1. **Open Environment Variables:**
   - Press `Win + R`
   - Type: `sysdm.cpl` and press Enter
   - Click "Environment Variables" button

2. **Edit PATH:**
   - Under "User variables", find `Path`
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\16\bin` (replace 16 with your version)
   - Click "OK" on all windows

3. **Restart PowerShell** and test:
   ```powershell
   psql --version
   ```

#### Method C: Using PowerShell (Permanent - User Level)

Run PowerShell as Administrator and execute:

```powershell
# Replace 16 with your PostgreSQL version
$postgresPath = "C:\Program Files\PostgreSQL\16\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;$postgresPath", "User")
```

Then **restart PowerShell** and test:
```powershell
psql --version
```

---

### Option 3: Use Full Path (Quick Fix)

If you just want to proceed without changing PATH, use the full path:

```powershell
# Replace 16 with your PostgreSQL version
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE inventory_system;"
```

For migrations:
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

---

## 🔍 Finding Your PostgreSQL Installation

If you're not sure where PostgreSQL is installed:

1. **Check Program Files:**
   ```powershell
   Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue
   ```

2. **Search for psql.exe:**
   ```powershell
   Get-ChildItem "C:\" -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 FullName
   ```

3. **Check Windows Services:**
   ```powershell
   Get-Service -Name "*postgres*"
   ```

---

## ✅ Verify It Works

After adding to PATH, test with:

```powershell
# Check version
psql --version

# Test connection (you'll be prompted for password)
psql -U postgres
```

If you see the PostgreSQL version, you're all set! 🎉

---

## 📝 Next Steps

Once `psql` is working, continue with Step 1 of WINDOWS_SETUP.md:

1. **Create the database:**
   ```powershell
   psql -U postgres -c "CREATE DATABASE inventory_system;"
   ```

2. **Run migrations:**
   ```powershell
   psql -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
   ```

---

## 🆘 Still Having Issues?

1. **Make sure PostgreSQL service is running:**
   ```powershell
   Get-Service -Name "*postgres*"
   ```

2. **Check if PostgreSQL is actually installed:**
   - Look in "Add or Remove Programs" for PostgreSQL

3. **Reinstall PostgreSQL** if needed, making sure to check the PATH option during installation


# How to Find PostgreSQL Installation on Windows

If `psql` is not recognized, PostgreSQL's `bin` directory is not in your PATH. Here's how to find it:

## Method 1: Check Common Installation Locations

PostgreSQL is typically installed in one of these locations:

- `C:\Program Files\PostgreSQL\<version>\bin\psql.exe`
- `C:\Program Files (x86)\PostgreSQL\<version>\bin\psql.exe`
- `%USERPROFILE%\AppData\Local\Programs\PostgreSQL\<version>\bin\psql.exe`

Common versions: 12, 13, 14, 15, 16, 17

## Method 2: Search Using File Explorer

1. Open File Explorer
2. Navigate to `C:\Program Files\PostgreSQL\`
3. Look for folders with version numbers (e.g., `15`, `16`)
4. Open the version folder → `bin` → look for `psql.exe`

## Method 3: Use Windows Search

1. Press `Win + S` to open Windows Search
2. Search for "psql.exe"
3. Right-click on `psql.exe` → "Open file location"
4. Copy the full path

## Method 4: Check pgAdmin

If you have pgAdmin installed:

1. Open pgAdmin
2. Go to File → Preferences → Paths
3. Check the "Binary paths" section - it shows where PostgreSQL tools are installed

## Method 5: Check PostgreSQL Service

1. Press `Win + R`, type `services.msc`, press Enter
2. Look for services starting with "postgresql"
3. Right-click → Properties → check the "Path to executable" or "Path name"
4. The path will point to the PostgreSQL installation directory

## Once You Find the Path

### Option A: Use Full Path Directly

Replace `<version>` with your PostgreSQL version (e.g., 16):

```powershell
# Set password
$env:PGPASSWORD = "your_postgres_password"
$env:PGSSLMODE = "disable"

# Create database using full path
& "C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE inventory_system;"
```

### Option B: Add to PATH (Permanent Fix)

1. Press `Win + X` → System → Advanced system settings
2. Click "Environment Variables"
3. Under "User variables", find and select "Path" → Edit
4. Click "New" → Add: `C:\Program Files\PostgreSQL\<version>\bin`
5. Replace `<version>` with your actual version (e.g., `16`)
6. Click OK on all dialogs
7. **Restart PowerShell/Command Prompt**

After adding to PATH, you can use `psql` directly:

```powershell
$env:PGPASSWORD = "your_postgres_password"
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;"
```

### Option C: Add to PATH for Current Session Only

```powershell
# Replace <version> with your PostgreSQL version
$env:PATH += ";C:\Program Files\PostgreSQL\<version>\bin"

# Now you can use psql
$env:PGPASSWORD = "your_postgres_password"
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;"
```

## Alternative: Use pgAdmin (GUI)

If you prefer a graphical interface:

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name it: `inventory_system`
5. Click Save


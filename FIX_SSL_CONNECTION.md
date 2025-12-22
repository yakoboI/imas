# 🔒 Fixing PostgreSQL SSL Connection Issue

## Problem
You're getting this error:
```
server does not support ssl but ssl was required
```
or
```
SSL connection is required. Please specify SSL options and retry.
```

This happens when PostgreSQL is configured to require SSL, but the connection isn't using SSL (or vice versa).

---

## ✅ Solution 1: Connect via psql WITHOUT SSL (Quick Fix)

When using `psql` command line, add the `--no-ssl` flag or use connection string without SSL:

```powershell
# Method 1: Use --no-ssl flag
psql -U postgres --no-ssl -c "CREATE DATABASE inventory_system;"

# Method 2: Use connection string with sslmode=disable
psql "postgresql://postgres:your_password@localhost:5432/postgres?sslmode=disable" -c "CREATE DATABASE inventory_system;"

# Method 3: Set environment variable
$env:PGSSLMODE = "disable"
psql -U postgres -c "CREATE DATABASE inventory_system;"
```

For migrations:
```powershell
$env:PGSSLMODE = "disable"
psql -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

---

## ✅ Solution 2: Configure PostgreSQL to NOT Require SSL (Local Development)

For local development, you can disable SSL requirement:

### Step 1: Edit PostgreSQL Configuration

1. Find your PostgreSQL data directory (usually `C:\Program Files\PostgreSQL\18\data`)
2. Open `postgresql.conf` in a text editor (as Administrator)
3. Find the line: `ssl = on`
4. Change it to: `ssl = off`
5. Save the file

### Step 2: Edit pg_hba.conf (Host-Based Authentication)

1. In the same data directory, open `pg_hba.conf`
2. Find lines that look like:
   ```
   host    all    all    127.0.0.1/32    scram-sha-256
   ```
3. Make sure they don't have `hostssl` (which requires SSL)
4. They should use `host` (not `hostssl`) for local connections
5. Save the file

### Step 3: Restart PostgreSQL Service

```powershell
# Find and restart PostgreSQL service
Restart-Service -Name postgresql-x64-18
# Or use Services.msc to restart
```

---

## ✅ Solution 3: Update Backend Configuration (Already Done)

The `backend/src/config/database.js` has been updated to disable SSL for local development.

Make sure your `.env` file does NOT have `DB_SSL=true` (or set it to `false`):

```env
# In backend/.env
DB_SSL=false
# Or just don't include DB_SSL at all (defaults to false)
```

---

## 🧪 Test the Connection

After applying the fix, test the connection:

```powershell
# Set SSL mode to disable
$env:PGSSLMODE = "disable"

# Test connection
psql -U postgres -c "SELECT version();"

# If that works, create the database
psql -U postgres -c "CREATE DATABASE inventory_system;"
```

---

## 📝 Quick Reference: SSL Modes

- `disable` - No SSL (use for local development)
- `allow` - Try non-SSL first, fallback to SSL
- `prefer` - Try SSL first, fallback to non-SSL (default)
- `require` - Require SSL
- `verify-ca` - Require SSL and verify CA
- `verify-full` - Require SSL and verify CA + hostname

For local development, use `disable` or `allow`.

---

## 🎯 Recommended Approach for Local Development

**Easiest solution:** Just set the environment variable before running psql commands:

```powershell
# Add this to your PowerShell session
$env:PGSSLMODE = "disable"

# Now all psql commands will work without SSL
psql -U postgres -c "CREATE DATABASE inventory_system;"
psql -U postgres -d inventory_system -f backend\src\database\migrations\001_create_tables.sql
```

This is the simplest and doesn't require changing PostgreSQL configuration files.


# 🗄️ Database Initialization Guide

## Why You See "You have no tables"

When you look at your database interface (Railway Postgres, Vercel Postgres, etc.) and see:
- "You have no tables"
- Empty database with just the default PostgreSQL tables

**This is completely normal!** The database is empty because you haven't run the migrations yet. The migration file contains all the SQL commands needed to create the tables.

---

## ✅ Solution: Run the Migration

You have **two options** to create the tables:

### Option 1: Using Railway Web Interface (If Available)

**⚠️ IMPORTANT: Do NOT use the "Create table" form!** Railway doesn't have a built-in SQL query editor in their web interface, so you should use **Option 2 (Command Line)** instead.

However, if Railway adds a SQL query editor in the future, you would:
1. Find the SQL Query Editor (usually in "Data" or "Query" tab)
2. Copy the entire migration file: `backend/src/database/migrations/001_create_tables.sql`
3. Paste and run the SQL
4. Verify tables appear in the Data section

**For Railway, use Option 2 (Command Line) - it's the recommended method.**

---

### Option 2: Using Command Line (psql) - Recommended for Railway

If you're using Railway Postgres, this is the easiest method using your connection details.

#### Step 1: Get Your Connection Details

From Railway Postgres → Connect tab, you should see:
- **Connection URL**: `postgresql://postgres:****@yamabiko.proxy.rlwy.net:42342/railway`
- Click "show" to reveal the password (or use the Raw psql command format)

Your details:
- **Host**: `yamabiko.proxy.rlwy.net`
- **Port**: `42342`
- **Database**: `railway`
- **User**: `postgres`
- **Password**: (click "show" in Railway to reveal it)

#### Step 2: Run the Migration

**Method A: Using Connection URL (Easiest)**

1. In Railway, click "show" next to "Connection URL" to reveal your password
2. Copy the full connection URL (it will look like: `postgresql://postgres:YOUR_PASSWORD@yamabiko.proxy.rlwy.net:42342/railway`)
3. Run this command:

```powershell
# Navigate to project directory
cd C:\Users\Admin\Desktop\imas

# Replace CONNECTION_URL with your full connection URL from Railway
psql "CONNECTION_URL?sslmode=require" -f backend\src\database\migrations\001_create_tables.sql
```

**Example (replace YOUR_PASSWORD with your actual password):**
```powershell
psql "postgresql://postgres:YOUR_PASSWORD@yamabiko.proxy.rlwy.net:42342/railway?sslmode=require" -f backend\src\database\migrations\001_create_tables.sql
```

**Method B: Using Individual Parameters**

If you prefer to use the raw psql command format:

```powershell
# Navigate to project directory
cd C:\Users\Admin\Desktop\imas

# Set password as environment variable (replace YOUR_PASSWORD)
$env:PGPASSWORD = "YOUR_PASSWORD"

# Run migration
psql -h yamabiko.proxy.rlwy.net -U postgres -p 42342 -d railway -f backend\src\database\migrations\001_create_tables.sql
```

**Note:** Railway requires SSL connections, so the connection URL method (Method A) with `?sslmode=require` is recommended.

---

## 📋 What Tables Will Be Created

After running the migration, you'll have these tables:

1. **tenants** - Multi-tenant organization data
2. **superadmins** - Super admin users
3. **users** - Regular users per tenant
4. **categories** - Product categories
5. **products** - Product catalog
6. **warehouses** - Warehouse locations
7. **inventory** - Stock levels per warehouse
8. **customers** - Customer information
9. **suppliers** - Supplier information
10. **orders** - Sales orders
11. **order_items** - Items in each order
12. **receipts** - Receipt records
13. **receipt_items** - Items in each receipt
14. **stock_movements** - Inventory movement history
15. **subscriptions** - Tenant subscription plans
16. **audit_logs** - System audit trail
17. **system_logs** - Super admin action logs

---

## 🔍 Verify It Worked

After running the migration:

1. **In the web interface**: You should see all the tables listed
2. **Using SQL**: Run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   You should see 17 tables.

---

## 📦 About Extensions

You might see a list of PostgreSQL extensions available. Here's what you need to know:

### Required Extensions
- **plpgsql** - Already installed (required by PostgreSQL, you don't need to do anything)

### Optional Extensions (You May Need)
- **uuid-ossp** - Only needed if you get an error about `gen_random_uuid()` not existing
  - Modern PostgreSQL (13+) has `gen_random_uuid()` built-in, so you probably won't need this
  - If you get an error: `function gen_random_uuid() does not exist`, then install this extension

### How to Install uuid-ossp (if needed)
If you get an error when running the migration about `gen_random_uuid()`, install the extension first:

1. Find the SQL Query Editor (same place where you'll run the migration)
2. Run this command first:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
3. Then run the migration file as usual

**Note:** Most modern cloud databases (Railway, Vercel, etc.) use PostgreSQL 13+ which has `gen_random_uuid()` built-in, so you probably won't need this step.

---

## ⚠️ Common Issues

### "I can't find the SQL Query Editor"
- The "Create table" form is NOT what you need
- Look for tabs/buttons: "Query", "SQL", "SQL Editor", "Run SQL", "New Query"
- Different providers have different interfaces - check their documentation
- Some have it hidden - look for a menu icon (☰) or "More" option

### "Permission denied" or "Access denied"
- Make sure you're using the correct database user with admin privileges
- Cloud databases usually provide admin users by default

### "function gen_random_uuid() does not exist"
- Install the `uuid-ossp` extension first (see "About Extensions" above)
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in the SQL editor before the migration

### "Connection timeout"
- Check that your database host and port are correct
- Make sure your IP is whitelisted (if required by your provider)

### "SSL required"
- Add `?sslmode=require` to your connection string (cloud databases require SSL)
- Or set `sslmode=require` in connection options

### Tables still empty after migration
- Make sure you ran the ENTIRE migration file (all 397 lines)
- Check for error messages in the SQL editor output
- Verify you're looking at the correct database
- Make sure you're looking at the table list, not the "Create table" form

---

## 🎯 Next Steps

After the tables are created:

1. **Seed Initial Data** (optional):
   ```powershell
   cd backend
   node src/database/seeds/run.js
   ```
   This creates the initial SuperAdmin account.

2. **Configure Backend Environment**:
   - Update your `.env` file with the database connection details
   - Make sure `DB_SSL=true` for cloud databases

3. **Start Your Backend**:
   ```powershell
   cd backend
   npm run dev
   ```

4. **Test Connection**:
   - Visit `http://localhost:5000/health`
   - Should return: `{"status":"ok","database":"connected"}`

---

## 💡 Quick Reference

**Migration File Location:**
```
backend/src/database/migrations/001_create_tables.sql
```

**Quick Copy for Web SQL Editor:**
Just open the file above and copy all 397 lines, then paste into your database's SQL query editor.


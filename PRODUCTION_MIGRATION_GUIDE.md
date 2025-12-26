# Production Migration Guide

## Migration: 007_add_password_reset_fields.sql

This migration adds password reset functionality to the users table.

### Migration Details

**File:** `backend/src/database/migrations/007_add_password_reset_fields.sql`

**Purpose:** Adds `password_reset_token` and `password_reset_expires` columns to the `users` table to support the forgot password feature.

**Changes:**
- Adds `password_reset_token` VARCHAR(255) column
- Adds `password_reset_expires` TIMESTAMP column
- Creates index on `password_reset_token` for faster lookups

### Running the Migration in Production

#### Option 1: Using Railway PostgreSQL Console (Recommended)

1. **Access Railway Dashboard:**
   - Go to https://railway.app
   - Navigate to your project
   - Click on your PostgreSQL service

2. **Open Query Editor:**
   - Click on the "Query" tab or "Data" tab
   - Open the PostgreSQL query editor

3. **Run the Migration:**
   - Copy the contents of `backend/src/database/migrations/007_add_password_reset_fields.sql`
   - Paste into the query editor
   - Execute the query

#### Option 2: Using psql Command Line

1. **Connect to Production Database:**
   ```bash
   psql $DATABASE_URL
   ```
   Or if using Railway CLI:
   ```bash
   railway connect postgres
   ```

2. **Run the Migration:**
   ```sql
   -- Add password reset fields to users table
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
   ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

   -- Create index on password_reset_token for faster lookups
   CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

   -- Add comment for documentation
   COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset requests';
   COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token (typically 1 hour from creation)';
   ```

#### Option 3: Using Railway CLI (if migration script exists)

If you have the migration runner script set up:

```bash
cd backend
railway run node src/database/migrations/run-all-railway-migrations.js
```

### Verification

After running the migration, verify it was successful:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('password_reset_token', 'password_reset_expires');

-- Check if index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' 
  AND indexname = 'idx_users_password_reset_token';
```

Expected output should show:
- `password_reset_token` column (VARCHAR)
- `password_reset_expires` column (TIMESTAMP)
- `idx_users_password_reset_token` index

### Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_users_password_reset_token;

-- Remove columns
ALTER TABLE users 
DROP COLUMN IF EXISTS password_reset_token,
DROP COLUMN IF EXISTS password_reset_expires;
```

### Important Notes

1. **No Data Loss:** This migration only adds new columns and does not modify existing data
2. **Safe to Run:** Uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
3. **Backward Compatible:** Existing functionality will continue to work
4. **Production Ready:** The migration has been tested and is production-safe

### Post-Migration

After running the migration:
1. The forgot password feature will be fully functional
2. Users can request password resets via the `/forgot-password` page
3. Password reset tokens will expire after 1 hour (as configured in the backend)

### Support

If you encounter any issues:
1. Check Railway logs for any errors
2. Verify database connection is active
3. Ensure you have proper database permissions
4. Review the migration file for syntax errors

---

**Migration Status:** ✅ Ready for Production
**Date:** 2025-12-26
**Commit:** 681fa89


# Database Migrations Guide

## ✅ Safe Migration Practices

Your database migration system is designed to **preserve all existing data** when applying new changes. Here's how it works:

### Current Migration Safety Features

1. **Non-Destructive SQL Commands**
   - All migrations use `IF NOT EXISTS` clauses
   - Tables: `CREATE TABLE IF NOT EXISTS`
   - Columns: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - Indexes: `CREATE INDEX IF NOT EXISTS`

2. **Sequelize Sync Disabled**
   - Automatic schema sync is disabled in production
   - Manual migrations are required (safer approach)

3. **Additive Changes Only**
   - Migrations add new features without removing existing ones
   - Data updates use `UPDATE` statements (no `DELETE` or `TRUNCATE`)

## 📋 How to Run Migrations

### Running a Single Migration

```bash
cd backend
node src/database/migrations/run-migration.js <migration-file.sql>
```

**Example:**
```bash
node src/database/migrations/run-migration.js 003_add_max_warehouses.sql
```

### Available Migrations

1. `001_create_tables.sql` - Initial schema (run once)
2. `002_add_system_logs_archive.sql` - Adds archive table
3. `003_add_max_warehouses.sql` - Adds max_warehouses column
4. `004_add_superadmin_avatar_url.sql` - Adds avatar_url column
5. `005_add_notification_tables.sql` - Adds notification tables

## 🔒 Data Safety Guarantees

### What Migrations WILL Do:
- ✅ Add new tables
- ✅ Add new columns to existing tables
- ✅ Add new indexes
- ✅ Update existing data values
- ✅ Set default values for new columns

### What Migrations WILL NOT Do:
- ❌ Drop existing tables
- ❌ Drop existing columns
- ❌ Delete existing data
- ❌ Truncate tables
- ❌ Modify existing data structure destructively

## 📝 Creating New Migrations

When creating a new migration file, follow these patterns:

### Adding a New Column
```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name VARCHAR(255) DEFAULT 'default_value';
```

### Adding a New Table
```sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- other columns
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Adding an Index
```sql
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);
```

### Updating Existing Data
```sql
-- Safe: Updates data without deleting
UPDATE table_name 
SET column_name = 'new_value' 
WHERE condition;
```

## ⚠️ Important Notes

1. **Always Backup First**
   - Before running migrations in production, backup your database
   - Use the backup scripts in `deployment/scripts/`

2. **Test Migrations Locally**
   - Test migrations on a copy of production data first
   - Verify data integrity after migration

3. **Migration Order Matters**
   - Run migrations in numerical order (001, 002, 003...)
   - Don't skip migrations

4. **Check Dependencies**
   - Ensure foreign key relationships are correct
   - Verify referenced tables exist before creating foreign keys

## 🔍 Verifying Migration Safety

To verify a migration is safe:

1. Check for destructive commands:
   - ❌ `DROP TABLE`
   - ❌ `DROP COLUMN`
   - ❌ `TRUNCATE`
   - ❌ `DELETE` (without WHERE clause)

2. Ensure all commands use `IF NOT EXISTS` or `IF EXISTS` checks

3. Verify UPDATE statements have proper WHERE clauses

## 🚀 Best Practices

1. **Version Control**
   - Always commit migration files to version control
   - Document what each migration does

2. **Rollback Plan**
   - Consider creating rollback scripts for critical migrations
   - Test rollback procedures before deploying

3. **Monitoring**
   - Monitor database performance after migrations
   - Check for any errors in application logs

4. **Documentation**
   - Document breaking changes (if any)
   - Update API documentation if schema changes affect endpoints

## 📞 Support

If you encounter any issues with migrations:
1. Check migration logs
2. Verify database connection
3. Ensure migration file syntax is correct
4. Review error messages carefully

---

**Remember**: Your current migration system is designed to be safe and preserve data. Always test migrations in a development environment first!


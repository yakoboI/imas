# Running Migrations on Railway Database

## Quick Start

### Option 1: Using Railway CLI (Recommended)

1. Install Railway CLI if you haven't:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   # Run all migrations
   railway run npm run migrate:all
   
   # Or run specific migration
   railway run npm run migrate:avatar
   ```

### Option 2: Set Railway Environment Variables Locally

1. Get your Railway database credentials from Railway dashboard

2. Set environment variables in PowerShell:
   ```powershell
   $env:DB_HOST="your-railway-host.proxy.rlwy.net"
   $env:DB_PORT="42342"
   $env:DB_NAME="railway"
   $env:DB_USER="postgres"
   $env:DB_PASSWORD="your-password"
   $env:DB_SSL="true"
   ```

3. Run migrations:
   ```powershell
   # Run all migrations
   npm run migrate:all
   
   # Or run specific migration
   npm run migrate:avatar
   ```

### Available Migration Scripts

- `run-all-migrations-railway.js` - Runs all migrations (checks if already executed)
- `run-avatar-migration-production.js` - Runs avatar_url migration only

Both scripts are safe to run multiple times - they check if migrations already exist.

## Verification

After running the migration, verify it worked:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'superadmins' AND column_name = 'avatar_url';
```

You should see:
- `column_name`: avatar_url
- `data_type`: character varying
- `character_maximum_length`: 500

## Troubleshooting

### Connection Issues
- Make sure `DB_SSL=true` is set for Railway
- Verify all database credentials are correct
- Check that Railway database service is running

### Column Already Exists
If you see "column already exists", that's fine! The migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### Permission Issues
Make sure your database user has `ALTER TABLE` permissions on the `superadmins` table.


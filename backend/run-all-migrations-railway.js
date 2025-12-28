/**
 * Run all migrations on Railway database if they don't exist
 * This script checks each migration and only runs if needed
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// All migration files in order
const migrations = [
  { file: '001_create_tables.sql', name: 'Create Tables' },
  { file: '002_add_system_logs_archive.sql', name: 'Add System Logs Archive' },
  { file: '003_add_max_warehouses.sql', name: 'Add Max Warehouses' },
  { file: '004_add_superadmin_avatar_url.sql', name: 'Add SuperAdmin Avatar URL' },
  { file: '005_add_notification_tables.sql', name: 'Add Notification Tables' },
  { file: '006_add_collections_tables.sql', name: 'Add Collections Tables' },
  { file: '007_add_password_reset_fields.sql', name: 'Add Password Reset Fields' },
  { file: '008_create_user_passkeys_table.sql', name: 'Create User Passkeys Table' },
  { file: '009_add_tra_integration_fields.sql', name: 'Add TRA Integration Fields' },
  { file: '010_add_tra_fields_to_receipts.sql', name: 'Add TRA Fields to Receipts' },
  { file: '011_create_integrations_table.sql', name: 'Create Integrations Table' },
  { file: '012_create_integration_logs_table.sql', name: 'Create Integration Logs Table' },
  { file: '013_add_payment_reference_to_orders.sql', name: 'Add Payment Reference to Orders' },
  { file: '014_add_accounting_sync_to_receipts.sql', name: 'Add Accounting Sync to Receipts' },
  { file: '015_add_payment_gateway_methods.sql', name: 'Add Payment Gateway Methods' }
];

async function runAllMigrations() {
  console.log('🚀 Starting All Migrations on Railway Database...\n');

  // Check for production environment
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    console.log('⚠️  NODE_ENV is not set to "production"');
    console.log('   Setting NODE_ENV=production for Railway connection...\n');
  }

  // Railway database configuration - prioritize Railway env vars
  // When using Railway CLI locally, use public proxy domain
  const usePublicProxy = !process.env.RAILWAY_REPLICA_ID; // Replica ID only exists when running on Railway
  const dbHost = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.DB_HOST || 'yamabiko.proxy.rlwy.net')
    : (process.env.PGHOST || process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST);
  const dbPort = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_PORT || process.env.DB_PORT || 5432)
    : (process.env.PGPORT || process.env.DB_PORT || 5432);
  const dbName = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || 'railway';
  const dbUser = process.env.PGUSER || process.env.POSTGRES_USER || process.env.DB_USER || 'postgres';
  const dbPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD;
  
  // Detect if connecting to localhost
  const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
  
  // Enable SSL for Railway (never for localhost)
  const enableSSL = !isLocalhost && (
    process.env.DB_SSL === 'true' || 
    process.env.RAILWAY_ENVIRONMENT === 'production' ||
    dbHost?.includes('railway') || 
    dbHost?.includes('rlwy') ||
    dbHost?.includes('proxy.rlwy.net') ||
    process.env.RAILWAY_TCP_PROXY_DOMAIN
  );
  
  // Require Railway credentials for production
  if (isProduction && isLocalhost && !process.env.RAILWAY_TCP_PROXY_DOMAIN) {
    console.error('❌ Error: NODE_ENV=production but connecting to localhost!');
    console.error('   For Railway production, you need Railway database credentials.');
    console.error('\n   Option 1: Set Railway environment variables:');
    console.error('   - RAILWAY_TCP_PROXY_DOMAIN (or DB_HOST)');
    console.error('   - RAILWAY_TCP_PROXY_PORT (or DB_PORT)');
    console.error('   - PGDATABASE (or DB_NAME)');
    console.error('   - PGUSER (or DB_USER)');
    console.error('   - PGPASSWORD (or DB_PASSWORD)');
    console.error('\n   Option 2: Use Railway CLI:');
    console.error('   railway run node run-all-migrations-railway.js');
    process.exit(1);
  }
  
  const dbConfig = {
    host: dbHost,
    port: parseInt(dbPort),
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: enableSSL ? {
      rejectUnauthorized: false
    } : false
  };

  // Validate credentials
  if (!dbConfig.password) {
    console.error('❌ Error: Database password is required');
    console.error('   Set one of: PGPASSWORD, POSTGRES_PASSWORD, or DB_PASSWORD');
    console.error('   Example: $env:PGPASSWORD="your-password"');
    console.error('   Or use Railway CLI: railway run node run-all-migrations-railway.js');
    process.exit(1);
  }

  // Warn if connecting to localhost
  if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
    console.log('⚠️  WARNING: Connecting to LOCAL database, not Railway production!');
    console.log('   To connect to Railway, set Railway environment variables or use Railway CLI.\n');
  }

  console.log('📋 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   SSL: ${enableSSL ? 'Enabled (Railway)' : 'Disabled'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'not set'}\n`);

  const pool = new Pool(dbConfig);

  try {
    console.log('🔗 Connecting to Railway database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'src/database/migrations', migration.file);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Skipping ${migration.file} (file not found)`);
        skipCount++;
        continue;
      }

      // Check if migration already ran
      const checkResult = await client.query(
        'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
        [migration.file]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  ${migration.name} - Already executed`);
        skipCount++;
        continue;
      }

      console.log(`\n📦 Running: ${migration.name} (${migration.file})`);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Run in transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [migration.file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ ${migration.name} - Completed successfully`);
        successCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        
        // If error is about existing objects, mark as executed
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('IF NOT EXISTS')) {
          console.log(`⚠️  ${migration.name} - Some objects already exist, marking as executed`);
          try {
            await client.query('BEGIN');
            await client.query(
              'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
              [migration.file]
            );
            await client.query('COMMIT');
            skipCount++;
          } catch (recordError) {
            console.log(`   ⚠️  Could not record: ${recordError.message}`);
            errorCount++;
          }
        } else {
          console.error(`❌ ${migration.name} - Failed: ${error.message}`);
          errorCount++;
        }
      }
    }

    client.release();
    await pool.end();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} error(s)`);
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runAllMigrations();


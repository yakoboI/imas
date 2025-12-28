const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running Password Reset Migration on Railway Production...\n');

  // Get Railway database credentials
  // When using Railway CLI locally, use public proxy domain
  // When actually running on Railway, use internal domain
  // Check if we can resolve the internal domain (only works on Railway infrastructure)
  const usePublicProxy = !process.env.RAILWAY_REPLICA_ID; // Replica ID only exists when running on Railway
  const dbHost = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.DB_HOST)
    : (process.env.PGHOST || process.env.RAILWAY_PRIVATE_DOMAIN);
  const dbPort = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_PORT || process.env.DB_PORT || 5432)
    : (process.env.PGPORT || 5432);
  const dbName = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.DB_NAME;
  const dbUser = process.env.PGUSER || process.env.POSTGRES_USER || process.env.DB_USER;
  const dbPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD;
  
  // Enable SSL for Railway (check if host contains railway indicators or if Railway env vars are present)
  const enableSSL = (
    process.env.DB_SSL === 'true' || 
    process.env.RAILWAY_ENVIRONMENT === 'production' ||
    dbHost?.includes('railway') || 
    dbHost?.includes('rlwy') ||
    dbHost?.includes('proxy.rlwy.net') ||
    process.env.RAILWAY_TCP_PROXY_DOMAIN
  );

  // Display configuration (hide password)
  console.log('📋 Database Configuration:');
  console.log(`   Host: ${dbHost || 'Not set'}`);
  console.log(`   Port: ${dbPort}`);
  console.log(`   Database: ${dbName || 'Not set'}`);
  console.log(`   User: ${dbUser || 'Not set'}`);
  console.log(`   SSL: ${enableSSL ? 'Enabled (Railway)' : 'Disabled (Local)'}`);
  console.log('');

  // Validate required variables
  if (!dbHost || !dbName || !dbUser || !dbPassword) {
    console.error('❌ Missing required database environment variables!');
    console.error('   Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    console.error('\n💡 For Railway, set these in Railway dashboard or use Railway CLI:');
    console.error('   railway run node src/database/migrations/run-password-reset-migration-railway.js');
    process.exit(1);
  }

  // Warn if connecting to local database
  if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
    console.log('⚠️  WARNING: Connecting to LOCAL database, not Railway production!');
    console.log('   To run on Railway, use Railway CLI or set Railway DB credentials.\n');
  }

  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: enableSSL ? {
      rejectUnauthorized: false
    } : false
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connecting to database...');
    console.log('✅ Connected successfully!\n');

    // Check if columns already exist
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_reset_token', 'password_reset_expires');
    `);

    if (checkResult.rows.length === 2) {
      console.log('✅ Password reset columns already exist!');
      console.log('   - password_reset_token');
      console.log('   - password_reset_expires');
      console.log('\n⏭️  Migration not needed - columns already present.');
      return;
    }

    // Read migration file
    const migrationFile = '007_add_password_reset_fields.sql';
    const migrationPath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    console.log(`📄 Reading migration file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Run migration in transaction
    await client.query('BEGIN');
    try {
      console.log('🔄 Executing migration...');
      await client.query(sql);
      
      // Record migration
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
        [migrationFile]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Migration completed successfully!\n`);
      
      // Verify columns
      console.log('🔍 Verifying columns...');
      const verifyResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('password_reset_token', 'password_reset_expires')
        ORDER BY column_name;
      `);
      
      if (verifyResult.rows.length === 2) {
        console.log('✅ Columns verified:');
        verifyResult.rows.forEach(row => {
          console.log(`   - ${row.column_name} (${row.data_type})`);
        });
      } else {
        console.log('⚠️  Warning: Expected 2 columns but found', verifyResult.rows.length);
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();


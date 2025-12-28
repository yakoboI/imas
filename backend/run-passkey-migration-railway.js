/**
 * Run Passkey Migration on Railway Production Database
 * Creates the user_passkeys table for WebAuthn/Passkey authentication
 * 
 * Usage:
 *   Option 1: railway run node run-passkey-migration-railway.js
 *   Option 2: Set Railway env vars and run: node run-passkey-migration-railway.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runPasskeyMigrationRailway() {
  console.log('🚀 Running Passkey Migration on Railway Production Database...\n');

  // Railway database configuration - prioritize Railway env vars
  // When using Railway CLI locally, use public proxy domain
  // When actually running on Railway, use internal domain
  const usePublicProxy = !process.env.RAILWAY_REPLICA_ID; // Replica ID only exists when running on Railway
  const dbHost = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.DB_HOST || process.env.PGHOST)
    : (process.env.PGHOST || process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST);
  const dbPort = usePublicProxy
    ? (process.env.RAILWAY_TCP_PROXY_PORT || process.env.DB_PORT || process.env.PGPORT || 5432)
    : (process.env.PGPORT || process.env.DB_PORT || 5432);
  const dbName = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || 'railway';
  const dbUser = process.env.PGUSER || process.env.POSTGRES_USER || process.env.DB_USER || 'postgres';
  const dbPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD;
  
  // Detect if connecting to localhost
  const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1' || !dbHost;
  
  // Enable SSL for Railway (never for localhost)
  const enableSSL = !isLocalhost && (
    process.env.DB_SSL === 'true' || 
    process.env.RAILWAY_ENVIRONMENT === 'production' ||
    dbHost?.includes('railway') || 
    dbHost?.includes('rlwy') || 
    dbHost?.includes('proxy.rlwy.net') ||
    process.env.RAILWAY_TCP_PROXY_DOMAIN
  );

  // Database configuration
  const dbConfig = {
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: enableSSL ? {
      rejectUnauthorized: false
    } : false
  };

  // Display configuration (hide password)
  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host || 'Not set'}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database || 'Not set'}`);
  console.log(`   User: ${dbConfig.user || 'Not set'}`);
  console.log(`   SSL: ${enableSSL ? 'Enabled (Railway)' : 'Disabled (Local)'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'not set'}\n`);

  // Check if required env vars are set
  if (!dbConfig.database || !dbConfig.user || !dbConfig.password) {
    console.error('❌ Missing database configuration!');
    console.log('\nRequired environment variables:');
    console.log('  Railway provides these automatically when using Railway CLI');
    console.log('  Or set manually:');
    console.log('    - PGDATABASE or POSTGRES_DB or DB_NAME');
    console.log('    - PGUSER or POSTGRES_USER or DB_USER');
    console.log('    - PGPASSWORD or POSTGRES_PASSWORD or DB_PASSWORD');
    console.log('\nOptional:');
    console.log('    - RAILWAY_TCP_PROXY_DOMAIN or DB_HOST or PGHOST');
    console.log('    - RAILWAY_TCP_PROXY_PORT or DB_PORT or PGPORT');
    console.log('\n💡 To run on Railway:');
    console.log('   Option 1: railway run node run-passkey-migration-railway.js');
    console.log('   Option 2: Set Railway env vars in Railway dashboard, then run:');
    console.log('            node run-passkey-migration-railway.js');
    process.exit(1);
  }

  // Warn if connecting to localhost in production mode
  if (isLocalhost && !process.env.RAILWAY_TCP_PROXY_DOMAIN) {
    console.log('⚠️  WARNING: Connecting to LOCAL database, not Railway production!');
    console.log('   To connect to Railway, set Railway environment variables or use Railway CLI.\n');
  }

  const pool = new Pool(dbConfig);

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    // Check if table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_passkeys'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('ℹ️  user_passkeys table already exists!');
      
      // Verify table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_passkeys'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Current table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      // Check if all required columns exist
      const requiredColumns = ['id', 'user_id', 'credential_id', 'public_key', 'counter', 'device_name', 'created_at', 'last_used_at'];
      const existingColumns = columns.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length === 0) {
        console.log('\n✅ Table structure is correct! Migration already completed.');
      } else {
        console.log(`\n⚠️  Missing columns: ${missingColumns.join(', ')}`);
        console.log('   You may need to run the full migration script.');
      }

      // Count existing passkeys
      const countResult = await client.query('SELECT COUNT(*) FROM user_passkeys');
      console.log(`\n📊 Total passkeys registered: ${countResult.rows[0].count}`);
      
      client.release();
      await pool.end();
      return;
    }

    // Read migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/008_create_user_passkeys_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    console.log('📄 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Run migration in transaction
    console.log('🔄 Executing migration...');
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!\n');

      // Verify table was created
      const verifyCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_passkeys'
        );
      `);

      if (verifyCheck.rows[0].exists) {
        console.log('✅ Verification: user_passkeys table created successfully!');
        
        // Show table structure
        const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'user_passkeys'
          ORDER BY ordinal_position;
        `);
        
        console.log('\n📋 Table structure:');
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    client.release();
    await pool.end();

    console.log('\n🎉 Passkey migration completed on Railway production database!');
    console.log('\n✅ Passkeys are now ready to use in production!');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check:');
      console.error('   - Is your Railway database running?');
      console.error('   - Are DB_HOST and DB_PORT correct?');
      console.error('   - If using Railway CLI, make sure you\'re in the correct project');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   - Are DB_USER and DB_PASSWORD correct?');
      console.error('   - Verify Railway environment variables are set');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Check:');
      console.error('   - Is DB_NAME correct?');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Host not found. Check:');
      console.error('   - Is DB_HOST correct?');
      console.error('   - If using Railway, use Railway CLI or set RAILWAY_TCP_PROXY_DOMAIN');
    }
    
    process.exit(1);
  }
}

// Run migration
runPasskeyMigrationRailway();


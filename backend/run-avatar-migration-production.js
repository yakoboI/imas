/**
 * Migration script to add avatar_url column to superadmins table on Railway/Production database
 * 
 * This script can accept Railway credentials via:
 * 1. Environment variables (DB_HOST, DB_PORT, etc.)
 * 2. Command line arguments
 * 3. .env file (if Railway credentials are set)
 * 
 * Usage:
 *   node run-avatar-migration-production.js
 *   OR with Railway CLI: railway run node run-avatar-migration-production.js
 *   OR with env vars: DB_HOST=xxx DB_USER=xxx DB_PASSWORD=xxx node run-avatar-migration-production.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting Migration: Add avatar_url to superadmins table on Production/Railway...\n');

  // Get credentials from environment or command line args
  // Priority: Command line args > Environment variables > .env file
  const dbHost = process.argv.find(arg => arg.startsWith('--host='))?.split('=')[1] || process.env.DB_HOST;
  const dbPort = parseInt(
    process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1] || 
    process.env.DB_PORT || 
    '5432'
  );
  const dbName = process.argv.find(arg => arg.startsWith('--database='))?.split('=')[1] || process.env.DB_NAME;
  const dbUser = process.argv.find(arg => arg.startsWith('--user='))?.split('=')[1] || process.env.DB_USER;
  const dbPassword = process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1] || process.env.DB_PASSWORD;
  
  // Enable SSL if host contains 'railway' or 'rlwy' or DB_SSL is 'true'
  const enableSSL = (
    process.env.DB_SSL === 'true' || 
    dbHost?.includes('railway') || 
    dbHost?.includes('rlwy')
  );
  
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
  console.log('📋 Migration Configuration:');
  console.log(`   Host: ${dbConfig.host || 'Not set'}`);
  console.log(`   Port: ${dbConfig.port || 'Not set'}`);
  console.log(`   Database: ${dbConfig.database || 'Not set'}`);
  console.log(`   User: ${dbConfig.user || 'Not set'}`);
  console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
  console.log('');

  // Validate required environment variables
  const requiredVars = ['host', 'database', 'user', 'password'];
  const missingVars = requiredVars.filter(varName => !dbConfig[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Error: Missing required database credentials:');
    missingVars.forEach(varName => {
      console.error(`   - DB_${varName.toUpperCase()}`);
    });
    console.error('\n💡 Please provide credentials via:');
    console.error('   1. Environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL');
    console.error('   2. Command line: --host=xxx --port=xxx --database=xxx --user=xxx --password=xxx');
    console.error('   3. Railway CLI: railway run node run-avatar-migration-production.js');
    console.error('\nExample:');
    console.error('   DB_HOST=xxx.railway.app DB_USER=postgres DB_PASSWORD=xxx DB_NAME=railway DB_SSL=true node run-avatar-migration-production.js');
    process.exit(1);
  }

  const pool = new Pool(dbConfig);

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Check if column already exists
    console.log('🔍 Checking if avatar_url column already exists...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'superadmins' AND column_name = 'avatar_url';
    `);
    
    if (checkResult.rows.length > 0) {
      const column = checkResult.rows[0];
      console.log('✅ Column "avatar_url" already exists in superadmins table');
      console.log(`   Type: ${column.data_type}`);
      if (column.character_maximum_length) {
        console.log(`   Max Length: ${column.character_maximum_length}`);
      }
      console.log('\n🎉 No migration needed - column already exists!');
      client.release();
      await pool.end();
      process.exit(0);
    }
    
    console.log('📝 Column does not exist - proceeding with migration...\n');
    
    // Read and execute migration SQL
    const migrationPath = path.join(__dirname, 'src/database/migrations/004_add_superadmin_avatar_url.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');
    console.log('📦 SQL to execute:');
    console.log('─'.repeat(50));
    console.log(sql.trim());
    console.log('─'.repeat(50));
    console.log('');

    // Run migration in a transaction for safety
    console.log('📦 Running migration (in transaction)...');
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration SQL executed successfully!\n');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    // Verify column was added
    console.log('🔍 Verifying column was added...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'superadmins' AND column_name = 'avatar_url';
    `);
    
    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log(`\n✅ Column 'avatar_url' successfully added to superadmins table!`);
      console.log(`   Type: ${column.data_type}`);
      if (column.character_maximum_length) {
        console.log(`   Max Length: ${column.character_maximum_length}`);
      }
      console.log('\n💡 Avatar functionality is now available in the SuperAdmin portal!');
    } else {
      console.log('\n⚠️  Column verification failed - please check manually');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Migration completed successfully on Production/Railway database!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Error: Could not connect to database.');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication Error: Invalid username or password.');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database Error: Database does not exist.');
    }
    
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the migration
runMigration();


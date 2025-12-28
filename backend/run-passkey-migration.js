/**
 * Run Passkey Migration
 * Creates the user_passkeys table for WebAuthn/Passkey authentication
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runPasskeyMigration() {
  console.log('🔐 Running Passkey Migration...\n');

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  };

  // Check if required env vars are set
  if (!dbConfig.database || !dbConfig.user || !dbConfig.password) {
    console.error('❌ Missing database configuration!');
    console.log('Required environment variables:');
    console.log('  - DB_NAME (or POSTGRES_DB)');
    console.log('  - DB_USER (or POSTGRES_USER)');
    console.log('  - DB_PASSWORD (or POSTGRES_PASSWORD)');
    console.log('Optional:');
    console.log('  - DB_HOST (default: localhost)');
    console.log('  - DB_PORT (default: 5432)');
    console.log('  - DB_SSL (set to "true" for SSL connections)');
    process.exit(1);
  }

  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}\n`);

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

    console.log('\n🎉 Passkey migration completed!');
    console.log('\nNext steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Start your frontend app: cd ../frontend/web-app && npm run dev');
    console.log('3. Login and go to Profile → Passkeys to register a passkey');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check:');
      console.error('   - Is your database server running?');
      console.error('   - Are DB_HOST and DB_PORT correct?');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   - Are DB_USER and DB_PASSWORD correct?');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Check:');
      console.error('   - Is DB_NAME correct?');
    }
    
    process.exit(1);
  }
}

// Run migration
runPasskeyMigration();


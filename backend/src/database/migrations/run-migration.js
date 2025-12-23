const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting Database Migration...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventory_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Test connection
    console.log('🔗 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '002_add_system_logs_archive.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Execute the migration
    console.log('📦 Running migration (adding system_logs_archive table)...\n');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify table was created
    console.log('🔍 Verifying table was created...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_logs_archive';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ system_logs_archive table exists!\n');
    } else {
      console.log('⚠️  Warning: Table not found after migration\n');
    }
    
    client.release();
    await pool.end();
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the migration
runMigration();


const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runArchiveMigration() {
  console.log('🚀 Starting Archive Table Migration...\n');

  // Use environment variables for local development
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventory_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false // SSL for production (Railway), disabled for local
    } : false
  });

  try {
    // Test connection
    console.log('🔗 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Check if archive table already exists
    console.log('🔍 Checking if system_logs_archive table exists...');
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_logs_archive'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('⚠️  system_logs_archive table already exists. Skipping migration.\n');
      client.release();
      await pool.end();
      process.exit(0);
    }
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '002_add_system_logs_archive.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Execute the migration
    console.log('📦 Running archive table migration...\n');
    await client.query(sql);
    
    console.log('✅ Archive table migration completed successfully!\n');
    
    // Verify table was created
    console.log('🔍 Verifying table was created...');
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_logs_archive';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ system_logs_archive table created successfully!\n');
      
      // Show indexes
      const indexResult = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'system_logs_archive';
      `);
      
      console.log(`✅ Created ${indexResult.rows.length} indexes:`);
      indexResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.indexname}`);
      });
    } else {
      console.log('⚠️  Warning: Table not found after migration\n');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Archive table migration completed successfully!');
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
runArchiveMigration();


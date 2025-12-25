const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting Database Migration...\n');

  // Use environment variables for local development, fallback to Railway URL only if explicitly set
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
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '001_create_tables.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Execute the migration
    console.log('📦 Running migration (this may take a few seconds)...\n');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables were created...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n✅ Found ${result.rows.length} tables:`);
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify tables in your database');
    console.log('2. You should see all the tables listed above');
    console.log('3. You can now seed the database (optional):');
    console.log('   cd backend && node src/database/seeds/run.js');
    
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


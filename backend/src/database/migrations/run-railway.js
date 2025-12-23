const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Railway PostgreSQL connection URL
// Replace this with your actual connection URL from Railway
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:dstsWeaAwnAayKOLodUCoqRbatzGfAkR@yamabiko.proxy.rlwy.net:42342/railway';

async function runMigration() {
  console.log('🚀 Starting Railway Postgres Migration...\n');

  // Create connection pool with SSL for Railway
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Railway requires SSL but doesn't need certificate verification
    }
  });

  try {
    // Test connection
    console.log('🔗 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to Railway Postgres successfully!\n');
    
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
    console.log('1. Go to Railway → Your Postgres Service → Data tab');
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


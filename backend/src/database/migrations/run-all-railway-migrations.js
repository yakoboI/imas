const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Migration files in order
const migrations = [
  '001_create_tables.sql',
  '002_add_system_logs_archive.sql',
  '003_add_max_warehouses.sql',
  '004_add_superadmin_avatar_url.sql',
  '005_add_notification_tables.sql',
  '006_add_collections_tables.sql',
  '007_add_password_reset_fields.sql'
];

async function runAllMigrations() {
  console.log('🚀 Starting Railway Database Migrations...\n');

  // Use environment variables (Railway will provide these)
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false // SSL for Railway
    } : false
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connected to Railway database successfully!\n');

    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Skipping ${migrationFile} (file not found)`);
        continue;
      }

      // Check if migration already ran
      const checkResult = await client.query(
        'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
        [migrationFile]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${migrationFile} (already executed)`);
        continue;
      }

      console.log(`📄 Running migration: ${migrationFile}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Wrap in transaction
      await client.query('BEGIN');
      try {
        // Execute SQL - handle errors for existing objects gracefully
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
          [migrationFile]
        );
        
        await client.query('COMMIT');
        console.log(`✅ ${migrationFile} completed successfully\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        
        // If error is about existing objects, log warning but continue
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  ${migrationFile} - Some objects already exist, marking as executed`);
          // Still record migration as executed to avoid re-running
          try {
            await client.query('BEGIN');
            await client.query(
              'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
              [migrationFile]
            );
            await client.query('COMMIT');
            console.log(`✅ ${migrationFile} marked as executed\n`);
          } catch (recordError) {
            console.log(`⚠️  Could not record migration: ${recordError.message}`);
          }
        } else {
          throw error;
        }
      }
    }

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'schema_migrations'
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${result.rows.length} tables:`);
    result.rows.slice(0, 20).forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    if (result.rows.length > 20) {
      console.log(`   ... and ${result.rows.length - 20} more tables`);
    }

    console.log('\n🎉 All migrations completed successfully!');
    
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

// Run migrations
runAllMigrations();


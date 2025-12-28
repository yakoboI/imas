const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.log('Usage: node run-single-migration.js <migration-file.sql>');
  console.log('Example: node run-single-migration.js 007_add_password_reset_fields.sql');
  process.exit(1);
}

async function runMigration() {
  console.log(`🚀 Running migration: ${migrationFile}\n`);

  // Use environment variables
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connecting to database...');
    console.log('✅ Connected successfully!\n');

    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationPath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    // Check if migration already ran
    const checkResult = await client.query(
      'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
      [migrationFile]
    );

    if (checkResult.rows.length > 0) {
      console.log(`⏭️  Migration ${migrationFile} has already been executed`);
      console.log('   If you need to re-run it, remove it from schema_migrations table first.');
      return;
    }

    console.log(`📄 Reading migration file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Wrap in transaction
    await client.query('BEGIN');
    try {
      console.log('🔄 Executing migration...');
      await client.query(sql);
      
      // Record migration
      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
        [migrationFile]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Migration ${migrationFile} completed successfully!\n`);
      
      // Verify columns were added
      if (migrationFile.includes('password_reset')) {
        console.log('🔍 Verifying password reset columns...');
        const verifyResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('password_reset_token', 'password_reset_expires');
        `);
        
        if (verifyResult.rows.length === 2) {
          console.log('✅ Password reset columns verified:');
          verifyResult.rows.forEach(row => {
            console.log(`   - ${row.column_name}`);
          });
        } else {
          console.log('⚠️  Some columns may not have been created');
        }
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      // If error is about existing objects, log warning but continue
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⚠️  Some objects already exist, marking migration as executed`);
        try {
          await client.query('BEGIN');
          await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
            [migrationFile]
          );
          await client.query('COMMIT');
          console.log(`✅ Migration marked as executed\n`);
        } catch (recordError) {
          console.error(`❌ Could not record migration: ${recordError.message}`);
          throw recordError;
        }
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Migration completed!');
    
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

// Run migration
runMigration();


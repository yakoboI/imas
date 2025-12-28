const { Pool } = require('pg');
require('dotenv').config();

async function checkColumns() {
  console.log('🔍 Checking users table columns...\n');

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

    // Check if columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_reset_token', 'password_reset_expires')
      ORDER BY column_name;
    `);

    console.log(`Found ${result.rows.length} password reset columns:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ Password reset columns do NOT exist!');
      console.log('   Need to add: password_reset_token, password_reset_expires\n');
      
      // Offer to add them
      console.log('Would you like to add them now? (This will run the migration SQL directly)');
      console.log('Adding columns...\n');
      
      try {
        await client.query('BEGIN');
        
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
        `);
        
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
        `);
        
        await client.query('COMMIT');
        console.log('✅ Columns added successfully!\n');
        
        // Verify again
        const verifyResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('password_reset_token', 'password_reset_expires')
          ORDER BY column_name;
        `);
        
        console.log('✅ Verified columns:');
        verifyResult.rows.forEach(row => {
          console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding columns:', error.message);
        throw error;
      }
    } else {
      console.log('✅ Password reset columns exist:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:');
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

checkColumns();


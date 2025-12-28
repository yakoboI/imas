/**
 * Passkey Setup Verification Script
 * 
 * This script checks if passkeys are properly configured:
 * - Database table exists
 * - Dependencies are installed
 * - Environment variables are set
 * - Routes are accessible
 */

const { Pool } = require('pg');
require('dotenv').config();

async function verifyPasskeySetup() {
  console.log('🔍 Verifying Passkey Setup...\n');
  
  const checks = {
    dependencies: false,
    database: false,
    environment: false,
    routes: false
  };

  // Check 1: Dependencies
  console.log('1️⃣ Checking dependencies...');
  try {
    require('@simplewebauthn/server');
    console.log('   ✅ @simplewebauthn/server is installed');
    checks.dependencies = true;
  } catch (error) {
    console.log('   ❌ @simplewebauthn/server is NOT installed');
    console.log('   Run: npm install @simplewebauthn/server');
  }

  // Check 2: Database
  console.log('\n2️⃣ Checking database...');
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_passkeys'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ✅ user_passkeys table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_passkeys'
        ORDER BY ordinal_position;
      `);
      
      const requiredColumns = ['id', 'user_id', 'credential_id', 'public_key', 'counter', 'device_name', 'created_at', 'last_used_at'];
      const existingColumns = columns.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('   ✅ All required columns exist');
        checks.database = true;
      } else {
        console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
      }
    } else {
      console.log('   ❌ user_passkeys table does NOT exist');
      console.log('   Run migration: backend/src/database/migrations/008_create_user_passkeys_table.sql');
    }

    // Count existing passkeys
    const countResult = await client.query('SELECT COUNT(*) FROM user_passkeys');
    console.log(`   📊 Total passkeys registered: ${countResult.rows[0].count}`);

    client.release();
    await pool.end();
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    console.log('   Check your database configuration in .env');
  }

  // Check 3: Environment Variables
  console.log('\n3️⃣ Checking environment variables...');
  const rpName = process.env.RP_NAME || 'IMAS Inventory System';
  const rpID = process.env.RP_ID || (process.env.NODE_ENV === 'production' 
    ? process.env.DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'localhost'
    : 'localhost');
  const origin = process.env.ORIGIN || (process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:3000');

  console.log(`   RP_NAME: ${rpName}`);
  console.log(`   RP_ID: ${rpID}`);
  console.log(`   ORIGIN: ${origin}`);

  if (process.env.NODE_ENV === 'production') {
    if (rpID === 'localhost' || origin.includes('localhost')) {
      console.log('   ⚠️  Production mode detected but using localhost values');
      console.log('   Set RP_ID and ORIGIN environment variables for production');
    } else if (!origin.startsWith('https://')) {
      console.log('   ⚠️  Production requires HTTPS for passkeys');
      console.log('   ORIGIN should start with https://');
    } else {
      console.log('   ✅ Production environment variables look good');
      checks.environment = true;
    }
  } else {
    console.log('   ✅ Development environment (using defaults)');
    checks.environment = true;
  }

  // Check 4: Routes (check if route file exists)
  console.log('\n4️⃣ Checking routes...');
  try {
    const fs = require('fs');
    const path = require('path');
    const routeFile = path.join(__dirname, '../src/routes/passkey.routes.js');
    const controllerFile = path.join(__dirname, '../src/controllers/passkeyController.js');
    
    if (fs.existsSync(routeFile) && fs.existsSync(controllerFile)) {
      console.log('   ✅ Passkey routes and controller files exist');
      checks.routes = true;
    } else {
      console.log('   ❌ Passkey route or controller files missing');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify route files');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  
  const allPassed = Object.values(checks).every(v => v === true);
  
  if (allPassed) {
    console.log('✅ All checks passed! Passkeys should be ready to use.');
    console.log('\nNext steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Start your frontend app: cd frontend/web-app && npm run dev');
    console.log('3. Login and go to Profile → Passkeys to register a passkey');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above.');
    console.log('\nFailed checks:');
    if (!checks.dependencies) console.log('  - Dependencies');
    if (!checks.database) console.log('  - Database');
    if (!checks.environment) console.log('  - Environment variables');
    if (!checks.routes) console.log('  - Routes');
  }
  
  console.log('\n');
}

// Run verification
verifyPasskeySetup().catch(error => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});


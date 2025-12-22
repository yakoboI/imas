// Quick database connection test script
require('dotenv').config();
const { testConnection } = require('./src/config/database');

async function checkDatabase() {
  console.log('🔍 Checking database setup...\n');
  
  // Check if .env file has database config
  if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('❌ Missing database configuration in .env file');
    console.log('\nPlease ensure your .env file contains:');
    console.log('  DB_HOST=localhost');
    console.log('  DB_PORT=5432');
    console.log('  DB_NAME=inventory_system');
    console.log('  DB_USER=postgres');
    console.log('  DB_PASSWORD=your_password_here');
    process.exit(1);
  }

  console.log('📋 Configuration found:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || 5432}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}\n`);

  // Test connection
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();

  if (connected) {
    console.log('\n✅ Database is set up and connected!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run migrations: npm run migrate');
    console.log('   2. Seed data: npm run seed');
    console.log('   3. Start server: npm run dev');
  } else {
    console.log('\n❌ Database connection failed');
    console.log('\n💡 Possible issues:');
    console.log('   - PostgreSQL service is not running');
    console.log('   - Database "inventory_system" does not exist');
    console.log('   - Incorrect password in .env file');
    console.log('   - PostgreSQL is not installed');
  }

  process.exit(connected ? 0 : 1);
}

checkDatabase();


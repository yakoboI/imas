const { sequelize } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Running migration: ${migrationFile}\n`);

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Read migration file
    const migrationPath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await sequelize.query(sql);

    console.log(`✅ Migration ${migrationFile} completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file.sql>');
  console.error('Example: node run-migration.js 003_add_max_warehouses.sql');
  process.exit(1);
}

runMigration(migrationFile);

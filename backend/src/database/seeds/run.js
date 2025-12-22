const { sequelize } = require('../../config/database');
const seedSuperAdmin = require('./superadmin.seed');

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Run seeds
    await seedSuperAdmin();

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

runSeeds();


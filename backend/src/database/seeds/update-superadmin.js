const SuperAdmin = require('../../models/SuperAdmin');
const AuthService = require('../../services/authService');
const { sequelize } = require('../../config/database');
const { superadminEmail, superadminPassword } = require('../../config/environment');

async function updateSuperAdmin() {
  try {
    console.log('🔄 Updating SuperAdmin credentials...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Find existing superadmin (try new email first, then any superadmin)
    let existing = await SuperAdmin.findOne({ where: { email: superadminEmail } });
    
    // If not found with new email, find any existing superadmin
    if (!existing) {
      existing = await SuperAdmin.findOne({ where: { role: 'superadmin' } });
      if (existing) {
        console.log(`⚠️  Found existing superadmin with different email: ${existing.email}`);
        console.log(`   Will update to: ${superadminEmail}\n`);
      }
    }
    
    if (!existing) {
      console.log('❌ SuperAdmin not found. Run seed script first to create one.');
      console.log(`   Will create with email: ${superadminEmail}`);
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(superadminPassword);
    
    // Update superadmin
    await existing.update({
      password: hashedPassword,
      email: superadminEmail
    });

    console.log('✅ SuperAdmin credentials updated successfully!');
    console.log(`   Email: ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
    console.log('\n⚠️  Please ensure SUPERADMIN_PASSWORD is set in environment variables for production!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating SuperAdmin:', error);
    process.exit(1);
  }
}

updateSuperAdmin();


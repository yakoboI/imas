const SuperAdmin = require('../../models/SuperAdmin');
const AuthService = require('../../services/authService');
const { sequelize } = require('../../config/database');

// Direct credentials (override environment variables)
const NEW_EMAIL = 'admin@inventora.store';
const NEW_PASSWORD = 'KILEOchusi123!@';

async function updateSuperAdmin() {
  try {
    console.log('🔄 Updating SuperAdmin credentials...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Find any existing superadmin
    let existing = await SuperAdmin.findOne({ where: { role: 'superadmin' } });
    
    if (!existing) {
      // Try to find by any email
      existing = await SuperAdmin.findOne();
      if (!existing) {
        console.log('❌ No SuperAdmin found. Creating new one...\n');
        
        // Create new superadmin
        const hashedPassword = await AuthService.hashPassword(NEW_PASSWORD);
        const superadmin = await SuperAdmin.create({
          email: NEW_EMAIL,
          password: hashedPassword,
          name: 'Super Admin',
          role: 'superadmin',
          status: 'active'
        });
        
        console.log('✅ SuperAdmin created successfully!');
        console.log(`   Email: ${NEW_EMAIL}`);
        console.log(`   Password: ${NEW_PASSWORD}`);
        process.exit(0);
      }
    }

    const oldEmail = existing.email;
    console.log(`📧 Found existing superadmin: ${oldEmail}`);

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(NEW_PASSWORD);
    
    // Update superadmin (both email and password)
    await existing.update({
      password: hashedPassword,
      email: NEW_EMAIL
    });

    console.log('\n✅ SuperAdmin credentials updated successfully!');
    if (oldEmail !== NEW_EMAIL) {
      console.log(`   Email updated: ${oldEmail} → ${NEW_EMAIL}`);
    } else {
      console.log(`   Email: ${NEW_EMAIL}`);
    }
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log('\n⚠️  Please ensure these credentials are set in Railway environment variables!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating SuperAdmin:', error);
    process.exit(1);
  }
}

updateSuperAdmin();


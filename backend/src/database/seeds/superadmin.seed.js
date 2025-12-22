const SuperAdmin = require('../../models/SuperAdmin');
const AuthService = require('../../services/authService');
const { superadminEmail, superadminPassword } = require('../../config/environment');

async function seedSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existing = await SuperAdmin.findOne({ where: { email: superadminEmail } });
    
    if (existing) {
      console.log('✅ SuperAdmin already exists');
      return;
    }

    // Create superadmin
    const hashedPassword = await AuthService.hashPassword(superadminPassword);
    
    const superadmin = await SuperAdmin.create({
      email: superadminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'superadmin',
      status: 'active'
    });

    console.log('✅ SuperAdmin created successfully');
    console.log(`   Email: ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error seeding SuperAdmin:', error);
    throw error;
  }
}

module.exports = seedSuperAdmin;


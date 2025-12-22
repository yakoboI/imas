const User = require('../models/User');
const AuthService = require('../services/authService');
const AuditService = require('../services/auditService');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class UserController {
  // Get own profile
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: require('../models/Tenant'), as: 'tenant', attributes: ['id', 'name', 'subdomain'] },
          { model: User, as: 'manager', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  // Update own profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Store old values for audit
      const oldValues = {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        street_address: user.street_address,
        city: user.city,
        state_province: user.state_province,
        zip_postal_code: user.zip_postal_code,
        country: user.country,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        emergency_contact_relationship: user.emergency_contact_relationship,
        notification_preferences: user.notification_preferences
      };

      // Allowed fields for user to update
      const allowedFields = [
        'first_name',
        'last_name',
        'phone',
        'date_of_birth',
        'gender',
        'street_address',
        'city',
        'state_province',
        'zip_postal_code',
        'country',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'notification_preferences'
      ];

      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Validate date format if provided
      if (updateData.date_of_birth) {
        const date = new Date(updateData.date_of_birth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: 'Invalid date format for date of birth' });
        }
        updateData.date_of_birth = date;
      }

      await user.update(updateData);

      // Log audit trail (non-blocking)
      AuditService.logAction({
        tenant_id: user.tenant_id,
        user_id: userId,
        action: 'UPDATE_PROFILE',
        entity_type: 'User',
        entity_id: userId,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'User updated profile information'
      }).catch(err => {
        console.error('Failed to log audit trail:', err);
        // Don't fail the request if audit logging fails
      });

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      // Provide more detailed error information
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
          error: 'Database error',
          message: error.message || 'An error occurred while updating the profile'
        });
      }
      next(error);
    }
  }

  // Upload avatar
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `avatars/${user.tenant_id}`,
            public_id: `user-${userId}`,
            transformation: [
              { width: 200, height: 200, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const oldAvatarUrl = user.avatar_url;
      await user.update({ avatar_url: result.secure_url });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: user.tenant_id,
        user_id: userId,
        action: 'UPDATE_PROFILE_PICTURE',
        entity_type: 'User',
        entity_id: userId,
        old_values: { avatar_url: oldAvatarUrl },
        new_values: { avatar_url: result.secure_url },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'User updated profile picture'
      });

      res.json({
        message: 'Avatar uploaded successfully',
        avatar_url: result.secure_url
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All password fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Check password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error: 'Password must contain uppercase, lowercase, number, and special character'
        });
      }

      const userId = req.user.id;
      await AuthService.changePassword(userId, currentPassword, newPassword);

      const user = await User.findByPk(userId);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: user.tenant_id,
        user_id: userId,
        action: 'CHANGE_PASSWORD',
        entity_type: 'User',
        entity_id: userId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'User changed password'
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error.message.includes('incorrect')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(req, res, next) {
    try {
      // Log for debugging
      console.log('Getting notification preferences for user:', req.user.id);

      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'notification_preferences'],
        raw: false // Ensure we get a Sequelize model instance for proper JSONB handling
      });

      if (!user) {
        console.log('User not found:', req.user.id);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('User found, notification_preferences type:', typeof user.notification_preferences);

      // Handle JSONB field - Sequelize should auto-parse, but ensure it's an object
      let preferences = user.get ? user.get('notification_preferences') : user.notification_preferences;
      
      // If it's a string, try to parse it (some databases return JSONB as string)
      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences);
        } catch (parseError) {
          console.error('Error parsing notification_preferences JSON:', parseError);
          preferences = null;
        }
      }
      
      // If preferences is null, undefined, or not an object, use defaults
      if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
        console.log('Using default preferences');
        preferences = {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: false,
          lowStockAlerts: true,
          orderUpdates: true,
          reportDigests: false
        };
      }

      res.json({
        preferences
      });
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error);
      console.error('Error stack:', error.stack);
      // Return a more detailed error in development
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          error: 'Failed to get notification preferences',
          message: error.message,
          stack: error.stack
        });
      }
      next(error);
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get current preferences or default
      const currentPreferences = user.notification_preferences && typeof user.notification_preferences === 'object'
        ? user.notification_preferences
        : {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: false,
            lowStockAlerts: true,
            orderUpdates: true,
            reportDigests: false
          };

      // Merge with new preferences
      const preferences = {
        ...currentPreferences,
        ...req.body
      };

      await user.update({ notification_preferences: preferences });

      res.json({
        message: 'Notification preferences updated',
        preferences
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity
  static async getActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      const activity = await AuditService.getUserActivity(userId, tenantId, 50);

      res.json({ activity });
    } catch (error) {
      next(error);
    }
  }

  // Get all users (Admin only)
  static async getAllUsers(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, role, status } = req.query;

      const where = { tenant_id: tenantId };
      if (role) where.role = role;
      if (status) where.status = status;

      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create user (Admin only)
  static async createUser(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { email, password, role, ...userData } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email, tenant_id: tenantId }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      const user = await AuthService.registerUser(
        { email, password, role: role || 'viewer', ...userData },
        tenantId
      );

      res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findOne({
        where: { id, tenant_id: tenantId },
        attributes: { exclude: ['password'] },
        include: [
          { model: User, as: 'manager', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  // Update user (Admin only)
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const oldValues = { ...user.toJSON() };
      delete oldValues.password;

      // Admin can update employment fields
      const allowedFields = [
        'first_name',
        'last_name',
        'phone',
        'role',
        'status',
        'employee_id',
        'department',
        'position',
        'employment_date',
        'reports_to'
      ];

      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await user.update(updateData);

      // Log audit
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_USER',
        entity_type: 'User',
        entity_id: id,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `User ${id} updated by admin`
      });

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user (Admin only)
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.destroy();

      // Log audit
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_USER',
        entity_type: 'User',
        entity_id: id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `User ${id} deleted by admin`
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
module.exports.upload = upload.single('avatar');


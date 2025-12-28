const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../../data/system-settings.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Default settings
const defaultSettings = {
  systemName: 'Inventory Management System',
  maintenanceMode: false,
  allowNewRegistrations: true,
  maxTenants: 1000,
  sessionTimeout: 3600, // seconds
  backupFrequency: 'daily', // daily, weekly, monthly
  emailNotifications: true,
  socialMedia: {
    whatsapp1: '',
    whatsapp2: '',
    instagram: '',
    twitter: '',
    facebook: '',
    email: '',
  },
};

class SystemSettingsService {
  // Get system settings
  static async getSettings() {
    try {
      await ensureDataDir();
      
      try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(data);
        // Merge with defaults to ensure all fields exist
        return { ...defaultSettings, ...settings };
      } catch (error) {
        // File doesn't exist, create it with defaults
        if (error.code === 'ENOENT') {
          await ensureDataDir();
          await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
          return defaultSettings;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error reading system settings:', error);
      // Return defaults on error
      return defaultSettings;
    }
  }

  // Get social media links (public, no auth required)
  static async getSocialMediaLinks() {
    try {
      const settings = await this.getSettings();
      return settings.socialMedia || defaultSettings.socialMedia;
    } catch (error) {
      console.error('Error getting social media links:', error);
      return defaultSettings.socialMedia;
    }
  }

  // Save system settings
  static async saveSettings(settings, skipMerge = false) {
    try {
      await ensureDataDir();
      
      let updatedSettings;
      if (skipMerge) {
        // Direct save without merging (used for initial creation)
        updatedSettings = { ...defaultSettings, ...settings };
      } else {
        // Merge with existing settings
        try {
          const data = await fs.readFile(SETTINGS_FILE, 'utf8');
          const currentSettings = JSON.parse(data);
          updatedSettings = { ...defaultSettings, ...currentSettings, ...settings };
        } catch (error) {
          // File doesn't exist, just use provided settings merged with defaults
          if (error.code === 'ENOENT') {
            updatedSettings = { ...defaultSettings, ...settings };
          } else {
            throw error;
          }
        }
      }
      
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf8');
      return updatedSettings;
    } catch (error) {
      console.error('Error saving system settings:', error);
      throw new Error('Failed to save system settings');
    }
  }
}

module.exports = SystemSettingsService;


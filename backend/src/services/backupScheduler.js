const SystemSettingsService = require('./systemSettingsService');
const BackupService = require('./backupService');
const SystemLog = require('../models/SystemLog');

class BackupScheduler {
  constructor() {
    this.schedulerInterval = null;
    this.lastBackupDate = null;
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Check every hour if backup is needed
    this.schedulerInterval = setInterval(async () => {
      await this.checkAndRunBackup();
    }, 60 * 60 * 1000); // Check every hour

    // Run initial check
    this.checkAndRunBackup();
  }

  // Stop the scheduler
  stop() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      this.isRunning = false;
    }
  }

  // Check if backup is needed based on frequency setting
  async checkAndRunBackup() {
    try {
      const settings = await SystemSettingsService.getSettings();
      const frequency = settings.backupFrequency || 'daily';

      if (!this.shouldRunBackup(frequency)) {
        return;
      }

      // Check if pg_dump is available before attempting backup
      const pgDumpAvailable = await BackupService.checkPgDumpAvailable();
      if (!pgDumpAvailable) {
        // Don't log this as a failure, just skip silently
        return;
      }
      
      // Perform backup without superadmin ID (system-initiated)
      const result = await BackupService.performBackup(null);
      
      // Log the scheduled backup
      await SystemLog.create({
        superadmin_id: null,
        action: 'SCHEDULED_BACKUP',
        description: `Scheduled backup completed: ${result.filename} (${result.size} MB)`,
        ip_address: 'system',
        user_agent: 'backup-scheduler'
      }).catch(err => console.error('Failed to log scheduled backup:', err));

      this.lastBackupDate = new Date();
    } catch (error) {
      // Only log actual failures, not missing pg_dump (handled above)
      if (!error.message.includes('pg_dump command not found')) {
        console.error('Error in scheduled backup:', error);
        
        // Log the failure
        await SystemLog.create({
          superadmin_id: null,
          action: 'SCHEDULED_BACKUP_FAILED',
          description: `Scheduled backup failed: ${error.message}`,
          ip_address: 'system',
          user_agent: 'backup-scheduler'
        }).catch(err => console.error('Failed to log backup failure:', err));
      }
    }
  }

  // Determine if backup should run based on frequency and last backup time
  shouldRunBackup(frequency) {
    const now = new Date();
    
    // If no previous backup, run it
    if (!this.lastBackupDate) {
      return true;
    }

    const hoursSinceLastBackup = (now - this.lastBackupDate) / (1000 * 60 * 60);
    
    switch (frequency) {
      case 'daily':
        // Run once per day (24 hours)
        return hoursSinceLastBackup >= 24;
      
      case 'weekly':
        // Run once per week (168 hours)
        return hoursSinceLastBackup >= 168;
      
      case 'monthly':
        // Run once per month (approximately 720 hours / 30 days)
        return hoursSinceLastBackup >= 720;
      
      default:
        // Default to daily
        return hoursSinceLastBackup >= 24;
    }
  }

  // Force immediate backup (useful when settings change)
  async runBackupNow() {
    try {
      const result = await BackupService.performBackup(null);
      this.lastBackupDate = new Date();
      return result;
    } catch (error) {
      console.error('Error running immediate backup:', error);
      throw error;
    }
  }

  // Restart scheduler (useful when settings change)
  async restart() {
    this.stop();
    // Wait a bit before restarting
    setTimeout(() => {
      this.start();
    }, 1000);
  }
}

// Create singleton instance
const backupScheduler = new BackupScheduler();

module.exports = backupScheduler;


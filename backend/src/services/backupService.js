const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const SystemLog = require('../models/SystemLog');
const SystemSettingsService = require('./systemSettingsService');
const EmailService = require('./emailService');

const execAsync = promisify(exec);

class BackupService {
  // Execute command with timeout to prevent hanging
  static async execWithTimeout(command, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const childProcess = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });

      // Fallback timeout in case exec timeout doesn't work
      const timeout = setTimeout(() => {
        childProcess.kill();
        reject(new Error('Command timed out'));
      }, timeoutMs);

      childProcess.on('exit', () => {
        clearTimeout(timeout);
      });
    });
  }

  // Find pg_dump executable path (Windows-aware)
  static async findPgDumpPath() {
    const os = require('os');
    const isWindows = os.platform() === 'win32';
    const pgDumpName = isWindows ? 'pg_dump.exe' : 'pg_dump';
    
    // First, try to find pg_dump in PATH
    try {
      const command = isWindows ? 'where pg_dump' : 'which pg_dump';
      const { stdout } = await this.execWithTimeout(command, 3000);
      const pgDumpPath = stdout.trim().split('\n')[0];
      if (pgDumpPath && pgDumpPath.length > 0) {
        // Verify it works
        await this.execWithTimeout(`"${pgDumpPath}" --version`, 3000);
        return pgDumpPath;
      }
    } catch (error) {
      // pg_dump not in PATH, try common locations
    }
    
    // Check common PostgreSQL installation locations (Windows)
    if (isWindows) {
      const commonLocations = [
        'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\18\\bin\\pg_dump.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\17\\bin\\pg_dump.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_dump.exe',
      ];
      
      for (const location of commonLocations) {
        try {
          await fs.access(location);
          // Verify it works
          await this.execWithTimeout(`"${location}" --version`, 3000);
          return location;
        } catch (error) {
          // File doesn't exist or doesn't work, try next location
          continue;
        }
      }
    }
    
    return null;
  }

  // Check if pg_dump is available (with timeout to prevent hanging)
  static async checkPgDumpAvailable() {
    try {
      const pgDumpPath = await this.findPgDumpPath();
      return pgDumpPath !== null;
    } catch (error) {
      // Silently return false if pg_dump is not available or times out
      return false;
    }
  }

  // Get backup directory
  static getBackupDir() {
    return path.join(__dirname, '../../backups');
  }

  // Ensure backup directory exists
  static async ensureBackupDir() {
    const backupDir = this.getBackupDir();
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }
    return backupDir;
  }

  // Perform database backup
  static async performBackup(superadminId = null) {
    try {
      // Find pg_dump executable
      const pgDumpPath = await this.findPgDumpPath();
      if (!pgDumpPath) {
        const os = require('os');
        const isWindows = os.platform() === 'win32';
        const installScript = isWindows ? 'install-pg-dump.ps1' : 'install-pg-dump.sh';
        throw new Error(
          'pg_dump command not found. Please install PostgreSQL client tools to enable database backups.\n' +
          `Run: .\\${installScript} (Windows) or ./${installScript} (Linux/Mac)\n` +
          'Or download from: https://www.postgresql.org/download/'
        );
      }

      const backupDir = await this.ensureBackupDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
      const compressedFile = `${backupFile}.gz`;

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'inventory_system',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      };

      // Create database dump using pg_dump
      // Escape special characters in password for shell command
      const escapedPassword = dbConfig.password.replace(/"/g, '\\"');
      // Use the found pg_dump path (quoted for Windows paths with spaces)
      const pgDumpCommand = `PGPASSWORD="${escapedPassword}" "${pgDumpPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.name} --format=custom --file="${backupFile}"`;

      try {
        // Use timeout wrapper for backup command (30 minutes max for large databases)
        await this.execWithTimeout(pgDumpCommand, 30 * 60 * 1000);
      } catch (error) {
        // Check if pg_dump is available or timed out
        if (error.message.includes('pg_dump') || error.message.includes('not found') || error.message.includes('timed out')) {
          if (error.message.includes('timed out')) {
            throw new Error('pg_dump command timed out. The database may be too large or the connection is slow.');
          }
          throw new Error('pg_dump command not found. Please ensure PostgreSQL client tools are installed.');
        }
        throw error;
      }

      // Compress backup (use Node.js zlib for cross-platform compatibility)
      const zlib = require('zlib');
      const { pipeline } = require('stream/promises');
      const fsStreams = require('fs');
      
      const readStream = fsStreams.createReadStream(backupFile);
      const writeStream = fsStreams.createWriteStream(compressedFile);
      const gzipStream = zlib.createGzip();
      
      await pipeline(readStream, gzipStream, writeStream);
      
      // Delete uncompressed file
      await fs.unlink(backupFile);

      // Get file size
      const stats = await fs.stat(compressedFile);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Log backup action
      if (superadminId) {
        await SystemLog.create({
          superadmin_id: superadminId,
          action: 'BACKUP_CREATED',
          description: `Database backup created: ${path.basename(compressedFile)} (${fileSizeMB} MB)`,
          ip_address: 'system',
          user_agent: 'backup-service'
        }).catch(err => console.error('Failed to log backup:', err));
      }

      // Send notification if email notifications are enabled
      const settings = await SystemSettingsService.getSettings();
      if (settings.emailNotifications && superadminId) {
        try {
          const SuperAdmin = require('../models/SuperAdmin');
          const admin = await SuperAdmin.findByPk(superadminId);
          if (admin) {
            await EmailService.sendEmail({
              to: admin.email,
              subject: 'Database Backup Completed',
              html: `
                <h2>Database Backup Completed</h2>
                <p>A database backup has been created successfully.</p>
                <ul>
                  <li><strong>File:</strong> ${path.basename(compressedFile)}</li>
                  <li><strong>Size:</strong> ${fileSizeMB} MB</li>
                  <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              `
            }).catch(err => console.error('Failed to send backup notification email:', err));
          }
        } catch (emailError) {
          console.error('Error sending backup notification:', emailError);
        }
      }

      return {
        success: true,
        file: compressedFile,
        filename: path.basename(compressedFile),
        size: fileSizeMB,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Backup error:', error);
      
      // Log backup failure
      if (superadminId) {
        await SystemLog.create({
          superadmin_id: superadminId,
          action: 'BACKUP_FAILED',
          description: `Database backup failed: ${error.message}`,
          ip_address: 'system',
          user_agent: 'backup-service'
        }).catch(err => console.error('Failed to log backup failure:', err));
      }

      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  // Clean up old backups (keep backups for specified days)
  static async cleanupOldBackups(retentionDays = 30) {
    try {
      const backupDir = await this.ensureBackupDir();
      const files = await fs.readdir(backupDir);
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.sql.gz')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          const fileAge = now - stats.mtimeMs;

          if (fileAge > retentionMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      return { deletedCount };
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return { deletedCount: 0, error: error.message };
    }
  }

  // Get backup list
  static async getBackupList() {
    try {
      const backupDir = await this.ensureBackupDir();
      const files = await fs.readdir(backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.sql.gz')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          backups.push({
            filename: file,
            size: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  }
}

module.exports = BackupService;


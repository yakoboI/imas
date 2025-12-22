# Backup & Restore Scripts

This directory contains scripts for backing up and restoring the multitenant inventory system database.

## Scripts Overview

### 1. `backup-database.sh`
Full database backup script that creates a complete backup of the entire database.

**Usage:**
```bash
./backup-database.sh
```

**Environment Variables:**
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: inventory_system)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (required)
- `BACKUP_DIR` - Backup directory (default: ./backups)
- `RETENTION_DAYS` - Days to keep backups (default: 30)
- `S3_BUCKET` - S3 bucket for backup storage (optional)
- `ENCRYPTION_KEY` - Encryption key for backups (optional)

**Features:**
- Creates compressed SQL dump
- Optional encryption with AES-256
- SHA256 checksum verification
- Optional S3 upload
- Automatic cleanup of old backups
- Backup logging

### 2. `restore-database.sh`
Restore database from a backup file.

**Usage:**
```bash
./restore-database.sh <backup_file> [target_database]
```

**Example:**
```bash
./restore-database.sh backups/backup_inventory_system_20241220_120000.sql.gz
```

**Environment Variables:**
- Same as backup script
- `TARGET_DB_NAME` - Target database name (default: same as DB_NAME)
- `ENCRYPTION_KEY` - Required if backup is encrypted

**Features:**
- Verifies backup integrity (checksum)
- Supports encrypted backups
- Handles compressed backups
- Terminates existing connections
- Creates database if it doesn't exist

### 3. `backup-tenant.sh`
Create a backup for a specific tenant.

**Usage:**
```bash
./backup-tenant.sh <tenant_id>
```

**Example:**
```bash
./backup-tenant.sh 550e8400-e29b-41d4-a716-446655440000
```

**Features:**
- Exports only tenant-specific data
- Includes all tenant tables
- Compressed output
- Checksum verification

### 4. `restore-tenant.sh`
Restore data for a specific tenant.

**Usage:**
```bash
./restore-tenant.sh <tenant_id> <backup_file>
```

**Example:**
```bash
./restore-tenant.sh 550e8400-e29b-41d4-a716-446655440000 backups/tenants/tenant_xxx_20241220.sql.gz
```

**Features:**
- Verifies tenant exists
- Restores tenant-specific data only
- Checksum verification

### 5. `backup-audit-logs.sh`
Export audit logs for archival.

**Usage:**
```bash
./backup-audit-logs.sh
```

**Environment Variables:**
- `FORMAT` - Export format: csv or json (default: csv)
- `RETENTION_DAYS` - Days to keep audit backups (default: 730)

**Features:**
- CSV or JSON export
- Compressed output
- Long retention period (2 years default)

### 6. `scheduled-backup.sh`
Run all backup operations (for cron scheduling).

**Usage:**
```bash
./scheduled-backup.sh
```

**Features:**
- Runs full database backup
- Runs audit logs backup
- Optional tenant-specific backups
- Cleanup old backups
- Comprehensive logging

## Setup

### 1. Make scripts executable
```bash
chmod +x deployment/scripts/*.sh
```

### 2. Set environment variables
Create a `.env` file or export variables:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=inventory_system
export DB_USER=postgres
export DB_PASSWORD=your_password
export BACKUP_DIR=/path/to/backups
export ENCRYPTION_KEY=your_encryption_key  # Optional
export S3_BUCKET=your-backup-bucket        # Optional
```

### 3. Test backup
```bash
cd deployment/scripts
./backup-database.sh
```

## Scheduling Backups

### Using Cron

Add to crontab for daily backups at 3 AM:
```bash
crontab -e
```

Add this line:
```
0 3 * * * /path/to/deployment/scripts/scheduled-backup.sh >> /path/to/backups/cron.log 2>&1
```

### Using systemd timer (Linux)

Create `/etc/systemd/system/backup.service`:
```ini
[Unit]
Description=Database Backup Service

[Service]
Type=oneshot
EnvironmentFile=/path/to/.env
ExecStart=/path/to/deployment/scripts/scheduled-backup.sh
```

Create `/etc/systemd/system/backup.timer`:
```ini
[Unit]
Description=Daily Database Backup Timer

[Timer]
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable backup.timer
sudo systemctl start backup.timer
```

## Backup Storage

### Local Storage
Backups are stored in the `BACKUP_DIR` directory by default.

### S3 Storage
To enable S3 uploads:
1. Install AWS CLI: `pip install awscli`
2. Configure AWS credentials: `aws configure`
3. Set `S3_BUCKET` environment variable
4. Backups will automatically upload to S3

### Encryption
To enable backup encryption:
1. Set `ENCRYPTION_KEY` environment variable
2. Backups will be encrypted with AES-256-CBC
3. Use the same key for restore operations

## Restore Procedures

### Full Database Restore
```bash
./restore-database.sh backups/backup_inventory_system_20241220_120000.sql.gz.enc
```

### Tenant-Specific Restore
```bash
./restore-tenant.sh <tenant_id> backups/tenants/tenant_xxx_20241220.sql.gz
```

### Point-in-Time Recovery
For point-in-time recovery, you'll need to:
1. Restore the most recent full backup
2. Apply transaction logs (if using WAL archiving)
3. Or restore from a specific backup timestamp

## Monitoring

### Check Backup Status
```bash
tail -f backups/backup.log
tail -f backups/scheduled-backup.log
```

### Verify Backup Integrity
```bash
sha256sum -c backups/backup_inventory_system_20241220_120000.sql.gz.sha256
```

### Check Backup Size
```bash
du -sh backups/
```

## Troubleshooting

### Permission Issues
```bash
chmod +x deployment/scripts/*.sh
chown postgres:postgres deployment/scripts/*.sh
```

### Database Connection Issues
- Verify database credentials
- Check PostgreSQL is running
- Verify network connectivity

### Disk Space Issues
- Monitor backup directory size
- Adjust retention period
- Clean up old backups manually

### Encryption Issues
- Ensure `ENCRYPTION_KEY` is set for encrypted backups
- Use the same key for restore
- Key must be at least 8 characters

## Best Practices

1. **Regular Backups**: Schedule daily backups
2. **Test Restores**: Periodically test restore procedures
3. **Offsite Storage**: Use S3 or similar for offsite backups
4. **Encryption**: Encrypt sensitive backups
5. **Monitoring**: Monitor backup logs regularly
6. **Retention**: Keep backups according to compliance requirements
7. **Documentation**: Document restore procedures
8. **Automation**: Use cron or systemd for scheduling

## Support

For issues or questions, check the main project documentation or create an issue in the repository.


#!/bin/bash

# Scheduled Backup Script
# This script runs all backup operations and can be scheduled via cron

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_FILE="${BACKUP_DIR}/scheduled-backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

log "Starting scheduled backup process..."

# 1. Full database backup
log "Running full database backup..."
if bash "$SCRIPT_DIR/backup-database.sh"; then
  log "Full database backup completed successfully"
else
  log "ERROR: Full database backup failed"
  exit 1
fi

# 2. Audit logs backup
log "Running audit logs backup..."
if bash "$SCRIPT_DIR/backup-audit-logs.sh"; then
  log "Audit logs backup completed successfully"
else
  log "WARNING: Audit logs backup failed (non-critical)"
fi

# 3. Optional: Backup all tenants individually
# Uncomment to enable tenant-specific backups
# log "Running tenant-specific backups..."
# TENANT_IDS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
#   -tAc "SELECT id FROM tenants WHERE status = 'active'" 2>/dev/null || echo "")
# 
# for TENANT_ID in $TENANT_IDS; do
#   log "Backing up tenant: $TENANT_ID"
#   bash "$SCRIPT_DIR/backup-tenant.sh" "$TENANT_ID" || log "WARNING: Failed to backup tenant $TENANT_ID"
# done

# 4. Cleanup old backups
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql.gz*" -type f -mtime +30 -delete
find "$BACKUP_DIR" -name "*.csv.gz*" -type f -mtime +730 -delete

# 5. Send notification (optional)
# Uncomment and configure to send email notifications
# if command -v mail &> /dev/null; then
#   echo "Scheduled backup completed successfully at $(date)" | \
#     mail -s "Backup Completed" admin@example.com
# fi

log "Scheduled backup process completed successfully"

# Summary
echo ""
echo -e "${GREEN}=== Backup Summary ===${NC}"
echo "Backup directory: $BACKUP_DIR"
echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "Log file: $LOG_FILE"
echo ""

exit 0


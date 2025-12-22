#!/bin/bash

# Audit Logs Backup Script
# This script exports audit logs to CSV/JSON for archival

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_system}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups/audit-logs}"
RETENTION_DAYS="${RETENTION_DAYS:-730}" # 2 years
FORMAT="${FORMAT:-csv}" # csv or json

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/audit_logs_${TIMESTAMP}.${FORMAT}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo -e "${GREEN}Starting audit logs backup...${NC}"
echo "Format: $FORMAT"
echo "Timestamp: $TIMESTAMP"

# Export audit logs
echo -e "${YELLOW}Exporting audit logs...${NC}"

if [ "$FORMAT" = "csv" ]; then
  # Export to CSV
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "\COPY (SELECT * FROM audit_logs ORDER BY timestamp DESC) TO STDOUT WITH CSV HEADER" \
    > "$BACKUP_FILE"
elif [ "$FORMAT" = "json" ]; then
  # Export to JSON (requires PostgreSQL 9.2+)
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM audit_logs ORDER BY timestamp DESC) t" \
    > "$BACKUP_FILE"
else
  echo -e "${RED}Error: Unsupported format: $FORMAT${NC}"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Audit logs export failed${NC}"
  exit 1
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_FILE"

# Calculate file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo -e "${GREEN}Audit logs backup created: $COMPRESSED_FILE (Size: $FILE_SIZE)${NC}"

# Calculate checksum
CHECKSUM=$(sha256sum "$COMPRESSED_FILE" | cut -d' ' -f1)
CHECKSUM_FILE="${COMPRESSED_FILE}.sha256"
echo "$CHECKSUM  $(basename $COMPRESSED_FILE)" > "$CHECKSUM_FILE"

# Get record count
RECORD_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -tAc "SELECT COUNT(*) FROM audit_logs" 2>/dev/null || echo "0")

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "audit_logs_*.${FORMAT}.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "audit_logs_*.${FORMAT}.gz.sha256" -type f -mtime +$RETENTION_DAYS -delete

# Log backup status
LOG_FILE="${BACKUP_DIR}/backup.log"
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Audit logs backup: $COMPRESSED_FILE (Size: $FILE_SIZE, Records: $RECORD_COUNT)" >> "$LOG_FILE"

echo -e "${GREEN}Audit logs backup completed successfully!${NC}"
echo "Backup file: $COMPRESSED_FILE"
echo "Records exported: $RECORD_COUNT"
echo "Checksum: $CHECKSUM"

exit 0


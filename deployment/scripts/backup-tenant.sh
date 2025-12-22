#!/bin/bash

# Tenant-Specific Backup Script
# This script creates a backup for a specific tenant

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_system}"
DB_USER="${DB_USER:-postgres}"
TENANT_ID="${1:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups/tenants}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if tenant ID is provided
if [ -z "$TENANT_ID" ]; then
  echo -e "${RED}Error: Tenant ID not specified${NC}"
  echo "Usage: $0 <tenant_id>"
  echo "Example: $0 550e8400-e29b-41d4-a716-446655440000"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tenant_${TENANT_ID}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo -e "${GREEN}Starting tenant backup...${NC}"
echo "Tenant ID: $TENANT_ID"
echo "Timestamp: $TIMESTAMP"

# Get tenant name for reference
TENANT_NAME=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -tAc "SELECT name FROM tenants WHERE id = '$TENANT_ID'" 2>/dev/null || echo "Unknown")

echo "Tenant Name: $TENANT_NAME"

# Create tenant-specific backup
echo -e "${YELLOW}Creating tenant backup...${NC}"

# Export tenant data from all tables
TABLES=(
  "users"
  "products"
  "categories"
  "warehouses"
  "inventory"
  "orders"
  "order_items"
  "receipts"
  "receipt_items"
  "customers"
  "suppliers"
  "stock_movements"
  "subscriptions"
  "audit_logs"
)

# Start SQL dump
cat > "$BACKUP_FILE" << EOF
-- Tenant Backup
-- Tenant ID: $TENANT_ID
-- Tenant Name: $TENANT_NAME
-- Backup Date: $(date +%Y-%m-%d\ %H:%M:%S)
-- Database: $DB_NAME

BEGIN;

EOF

# Export data from each table
for TABLE in "${TABLES[@]}"; do
  echo -e "${YELLOW}Exporting $TABLE...${NC}"
  
  # Check if table has tenant_id column
  HAS_TENANT_ID=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='$TABLE' AND column_name='tenant_id'" 2>/dev/null || echo "0")
  
  if [ "$HAS_TENANT_ID" = "1" ]; then
    # Export tenant-specific data
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      -c "\COPY (SELECT * FROM $TABLE WHERE tenant_id = '$TENANT_ID') TO STDOUT WITH CSV HEADER" \
      >> "$BACKUP_FILE" 2>/dev/null || true
  fi
done

# Add commit
echo "COMMIT;" >> "$BACKUP_FILE"

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_FILE"

# Calculate file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo -e "${GREEN}Tenant backup created successfully: $COMPRESSED_FILE (Size: $FILE_SIZE)${NC}"

# Calculate checksum
CHECKSUM=$(sha256sum "$COMPRESSED_FILE" | cut -d' ' -f1)
CHECKSUM_FILE="${COMPRESSED_FILE}.sha256"
echo "$CHECKSUM  $(basename $COMPRESSED_FILE)" > "$CHECKSUM_FILE"

# Clean up old backups for this tenant
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "tenant_${TENANT_ID}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "tenant_${TENANT_ID}_*.sql.gz.sha256" -type f -mtime +$RETENTION_DAYS -delete

# Log backup status
LOG_FILE="${BACKUP_DIR}/backup.log"
mkdir -p "$BACKUP_DIR"
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Tenant backup: $TENANT_ID ($TENANT_NAME) - $COMPRESSED_FILE (Size: $FILE_SIZE)" >> "$LOG_FILE"

echo -e "${GREEN}Tenant backup process completed successfully!${NC}"
echo "Backup file: $COMPRESSED_FILE"
echo "Checksum: $CHECKSUM"

exit 0


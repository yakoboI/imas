#!/bin/bash

# Tenant-Specific Restore Script
# This script restores data for a specific tenant

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_system}"
DB_USER="${DB_USER:-postgres}"
TENANT_ID="${1:-}"
BACKUP_FILE="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if tenant ID and backup file are provided
if [ -z "$TENANT_ID" ] || [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Tenant ID and backup file must be specified${NC}"
  echo "Usage: $0 <tenant_id> <backup_file>"
  echo "Example: $0 550e8400-e29b-41d4-a716-446655440000 backups/tenants/tenant_xxx_20241220.sql.gz"
  exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}WARNING: This will restore tenant data and may overwrite existing data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Verify checksum if checksum file exists
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  echo -e "${YELLOW}Verifying backup integrity...${NC}"
  sha256sum -c "$CHECKSUM_FILE"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Backup file integrity check failed!${NC}"
    exit 1
  fi
  echo -e "${GREEN}Backup integrity verified${NC}"
fi

# Decompress if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo -e "${YELLOW}Decompressing backup...${NC}"
  RESTORE_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$RESTORE_FILE"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Decompression failed${NC}"
    exit 1
  fi
fi

# Verify tenant exists
TENANT_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -tAc "SELECT COUNT(*) FROM tenants WHERE id = '$TENANT_ID'" 2>/dev/null || echo "0")

if [ "$TENANT_EXISTS" = "0" ]; then
  echo -e "${RED}Error: Tenant with ID $TENANT_ID does not exist${NC}"
  exit 1
fi

# Restore tenant data
echo -e "${YELLOW}Restoring tenant data...${NC}"
echo "Tenant ID: $TENANT_ID"

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "$RESTORE_FILE" > /dev/null

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Tenant restore failed${NC}"
  exit 1
fi

# Clean up temporary file
if [ "$RESTORE_FILE" != "$BACKUP_FILE" ]; then
  rm -f "$RESTORE_FILE"
fi

# Log restore status
LOG_FILE="./backups/tenants/restore.log"
mkdir -p ./backups/tenants
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Tenant restored: $TENANT_ID from $BACKUP_FILE" >> "$LOG_FILE"

echo -e "${GREEN}Tenant restore completed successfully!${NC}"
echo "Tenant ID: $TENANT_ID"
echo "Restored from: $BACKUP_FILE"

exit 0


#!/bin/bash

# Database Restore Script for Multitenant Inventory System
# This script restores a database from a backup file

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_system}"
DB_USER="${DB_USER:-postgres}"
BACKUP_FILE="${1:-}"
TARGET_DB_NAME="${TARGET_DB_NAME:-$DB_NAME}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not specified${NC}"
  echo "Usage: $0 <backup_file> [target_database]"
  echo "Example: $0 backups/backup_inventory_system_20241220_120000.sql.gz"
  exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}WARNING: This will restore the database and may overwrite existing data!${NC}"
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

# Determine if file is encrypted
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.enc ]]; then
  if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${RED}Error: Encrypted backup requires ENCRYPTION_KEY${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Decrypting backup...${NC}"
  TEMP_FILE="${BACKUP_FILE%.enc}"
  openssl enc -aes-256-cbc -d -in "$BACKUP_FILE" -out "$TEMP_FILE" -k "$ENCRYPTION_KEY"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Decryption failed${NC}"
    exit 1
  fi
fi

# Decompress if needed
RESTORE_FILE="$TEMP_FILE"
if [[ "$TEMP_FILE" == *.gz ]]; then
  echo -e "${YELLOW}Decompressing backup...${NC}"
  RESTORE_FILE="${TEMP_FILE%.gz}"
  gunzip -c "$TEMP_FILE" > "$RESTORE_FILE"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Decompression failed${NC}"
    exit 1
  fi
fi

# Drop existing database connections (if restoring to same database)
if [ "$TARGET_DB_NAME" == "$DB_NAME" ]; then
  echo -e "${YELLOW}Terminating existing connections...${NC}"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$TARGET_DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
echo "Target database: $TARGET_DB_NAME"

# Check if database exists, create if not
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo -e "${YELLOW}Creating database $TARGET_DB_NAME...${NC}"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    -c "CREATE DATABASE $TARGET_DB_NAME;"
fi

# Restore from backup
if [[ "$RESTORE_FILE" == *.sql ]]; then
  # Plain SQL dump
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB_NAME" \
    -f "$RESTORE_FILE" > /dev/null
elif [[ "$RESTORE_FILE" == *.custom ]] || [[ "$BACKUP_FILE" == *.custom ]]; then
  # Custom format dump
  PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    -d "$TARGET_DB_NAME" -v "$RESTORE_FILE" > /dev/null
else
  # Try pg_restore first, fallback to psql
  PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    -d "$TARGET_DB_NAME" -v "$RESTORE_FILE" > /dev/null 2>&1 || \
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB_NAME" \
    -f "$RESTORE_FILE" > /dev/null
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Database restore failed${NC}"
  exit 1
fi

# Clean up temporary files
if [ "$TEMP_FILE" != "$BACKUP_FILE" ]; then
  rm -f "$TEMP_FILE"
fi
if [ "$RESTORE_FILE" != "$TEMP_FILE" ] && [ "$RESTORE_FILE" != "$BACKUP_FILE" ]; then
  rm -f "$RESTORE_FILE"
fi

# Log restore status
LOG_FILE="./backups/restore.log"
mkdir -p ./backups
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Database restored: $TARGET_DB_NAME from $BACKUP_FILE" >> "$LOG_FILE"

echo -e "${GREEN}Database restore completed successfully!${NC}"
echo "Database: $TARGET_DB_NAME"
echo "Restored from: $BACKUP_FILE"

exit 0


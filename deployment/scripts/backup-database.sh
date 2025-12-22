#!/bin/bash

# Database Backup Script for Multitenant Inventory System
# This script creates a timestamped database backup with encryption

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_system}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-database-backups}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
ENCRYPTED_FILE="${COMPRESSED_FILE}.enc"

echo -e "${GREEN}Starting database backup...${NC}"
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"

# Create database dump
echo -e "${YELLOW}Creating database dump...${NC}"
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Database dump failed${NC}"
  exit 1
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_FILE"

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Compression failed${NC}"
  exit 1
fi

# Encrypt backup if encryption key is provided
if [ -n "$ENCRYPTION_KEY" ]; then
  echo -e "${YELLOW}Encrypting backup...${NC}"
  openssl enc -aes-256-cbc -salt -in "$COMPRESSED_FILE" -out "$ENCRYPTED_FILE" -k "$ENCRYPTION_KEY"
  
  if [ $? -eq 0 ]; then
    rm "$COMPRESSED_FILE"
    FINAL_FILE="$ENCRYPTED_FILE"
  else
    echo -e "${RED}Error: Encryption failed${NC}"
    exit 1
  fi
else
  FINAL_FILE="$COMPRESSED_FILE"
fi

# Calculate file size
FILE_SIZE=$(du -h "$FINAL_FILE" | cut -f1)
echo -e "${GREEN}Backup created successfully: $FINAL_FILE (Size: $FILE_SIZE)${NC}"

# Calculate checksum
CHECKSUM=$(sha256sum "$FINAL_FILE" | cut -d' ' -f1)
CHECKSUM_FILE="${FINAL_FILE}.sha256"
echo "$CHECKSUM  $(basename $FINAL_FILE)" > "$CHECKSUM_FILE"
echo "Checksum: $CHECKSUM"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
  echo -e "${YELLOW}Uploading to S3...${NC}"
  aws s3 cp "$FINAL_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $FINAL_FILE)"
  aws s3 cp "$CHECKSUM_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $CHECKSUM_FILE)"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Upload to S3 completed${NC}"
  else
    echo -e "${RED}Warning: S3 upload failed${NC}"
  fi
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz*" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz*.sha256" -type f -mtime +$RETENTION_DAYS -delete

# Log backup status
LOG_FILE="${BACKUP_DIR}/backup.log"
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Backup completed: $FINAL_FILE (Size: $FILE_SIZE, Checksum: $CHECKSUM)" >> "$LOG_FILE"

echo -e "${GREEN}Backup process completed successfully!${NC}"
echo "Backup file: $FINAL_FILE"
echo "Checksum file: $CHECKSUM_FILE"

exit 0


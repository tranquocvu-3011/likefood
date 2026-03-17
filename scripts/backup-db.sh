#!/bin/bash
# LIKEFOOD - Database Backup Script
# Usage: ./scripts/backup-db.sh
# Crontab: 0 3 * * * /opt/likefood/scripts/backup-db.sh >> /var/log/likefood-backup.log 2>&1

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/likefood/backups/db"
RETENTION_DAYS=30
COMPOSE_FILE="/opt/likefood/docker-compose.yml"
DB_USER="likefood"
DB_NAME="weblikefood"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting database backup..."

# Backup MySQL from Docker container
docker compose -f "$COMPOSE_FILE" exec -T mysql \
  mysqldump -u "$DB_USER" -p"${MYSQL_PASSWORD:-}" "$DB_NAME" \
  --single-transaction --routines --triggers | \
  gzip > "${BACKUP_DIR}/weblikefood_${TIMESTAMP}.sql.gz"

BACKUP_SIZE=$(ls -lh "${BACKUP_DIR}/weblikefood_${TIMESTAMP}.sql.gz" | awk '{print $5}')
echo "[$TIMESTAMP] Backup completed: weblikefood_${TIMESTAMP}.sql.gz ($BACKUP_SIZE)"

# Remove old backups
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
echo "[$TIMESTAMP] Cleaned up $DELETED old backup(s)"

# Verify backup is not empty
if [ ! -s "${BACKUP_DIR}/weblikefood_${TIMESTAMP}.sql.gz" ]; then
  echo "[$TIMESTAMP] WARNING: Backup file is empty!"
  exit 1
fi

echo "[$TIMESTAMP] Backup successful ✓"

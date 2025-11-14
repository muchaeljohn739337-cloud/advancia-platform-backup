#!/bin/bash
# DigitalOcean Database Backup Script
# Run this via cron for automated backups
# Example cron: 0 3 * * * /app/scripts/backup-do-db.sh

set -e

BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
DATABASE_URL="${DATABASE_URL:-postgresql://advancia_user:password@localhost:5432/advancia_prod}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup at $(date)"
echo "📁 Backup location: $BACKUP_FILE"

# Extract credentials from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

# Run pg_dump with password
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --verbose \
  --format=plain \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup completed successfully"
echo "📊 Backup size: $BACKUP_SIZE"

# Keep only last 30 days of backups
echo "🧹 Cleaning old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
echo "✅ Cleanup completed"

# Optional: Upload to S3
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && [ -n "$S3_BACKUPS_BUCKET" ]; then
  echo "📤 Uploading to S3..."
  apt-get install -y awscli > /dev/null 2>&1 || true
  
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BACKUPS_BUCKET/backups/" \
    --region us-east-1 \
    --no-progress
  
  echo "✅ S3 upload completed"
fi

echo "🎉 Backup process finished at $(date)"

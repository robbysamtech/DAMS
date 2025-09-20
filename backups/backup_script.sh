#!/bin/bash

# DAMS MongoDB Backup Script
# This script creates a complete backup of the DAMS MongoDB database

# Configuration
DB_NAME="dams"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting DAMS MongoDB backup..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    log_message "ERROR: MongoDB is not running. Please start MongoDB first."
    log_message "To start MongoDB: brew services start mongodb-community"
    exit 1
fi

# Create mongodump backup
log_message "Creating mongodump backup..."
if mongodump --db "$DB_NAME" --out "$BACKUP_DIR"; then
    log_message "MongoDB dump completed successfully"
else
    log_message "ERROR: MongoDB dump failed"
    exit 1
fi

# Create JSON export for each collection
log_message "Creating JSON exports..."

# Export Users collection
mongoexport --db "$DB_NAME" --collection users --out "$BACKUP_DIR/users.json" --jsonArray
log_message "Users collection exported to users.json"

# Export Events collection
mongoexport --db "$DB_NAME" --collection events --out "$BACKUP_DIR/events.json" --jsonArray
log_message "Events collection exported to events.json"

# Export People collection
mongoexport --db "$DB_NAME" --collection people --out "$BACKUP_DIR/people.json" --jsonArray
log_message "People collection exported to people.json"

# Export Carousel collection
mongoexport --db "$DB_NAME" --collection carousels --out "$BACKUP_DIR/carousels.json" --jsonArray
log_message "Carousel collection exported to carousels.json"

# Export HomeSections collection
mongoexport --db "$DB_NAME" --collection homesections --out "$BACKUP_DIR/homesections.json" --jsonArray
log_message "HomeSections collection exported to homesections.json"

# Create backup metadata
cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database_name": "$DB_NAME",
  "backup_type": "full",
  "collections": [
    "users",
    "events", 
    "people",
    "carousels",
    "homesections"
  ],
  "mongodump_version": "$(mongodump --version | head -n1)",
  "mongoexport_version": "$(mongoexport --version | head -n1)"
}
EOF

# Create compressed archive
log_message "Creating compressed archive..."
cd backups
ARCHIVE_NAME="dams_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" "$(basename "$BACKUP_DIR")"
log_message "Compressed archive created: $ARCHIVE_NAME"

# Clean up individual backup directory (keep compressed version)
rm -rf "$(basename "$BACKUP_DIR")"

# Go back to project root for final logging
cd ..

log_message "Backup completed successfully!"
log_message "Backup location: backups/$ARCHIVE_NAME"
log_message "Log file: $LOG_FILE"

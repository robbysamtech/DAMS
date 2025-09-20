#!/bin/bash

# DAMS MongoDB Restore Script
# This script restores the DAMS MongoDB database from backup files

# Configuration
DB_NAME="dams"
BACKUP_DIR=""
LOG_FILE="backups/restore_$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -d, --directory DIR    Backup directory to restore from"
    echo "  -f, --file FILE        Compressed backup file to restore from"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d backups/20240914_180300"
    echo "  $0 -f backups/dams_backup_20240914_180300.tar.gz"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--directory)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Check if backup directory or file is provided
if [[ -z "$BACKUP_DIR" && -z "$BACKUP_FILE" ]]; then
    echo "Error: Please provide either a backup directory or backup file"
    show_usage
fi

log_message "Starting DAMS MongoDB restore..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    log_message "ERROR: MongoDB is not running. Please start MongoDB first."
    log_message "To start MongoDB: brew services start mongodb-community"
    exit 1
fi

# Handle compressed backup file
if [[ -n "$BACKUP_FILE" ]]; then
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_message "ERROR: Backup file $BACKUP_FILE not found"
        exit 1
    fi
    
    log_message "Extracting backup file: $BACKUP_FILE"
    EXTRACT_DIR="backups/temp_restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXTRACT_DIR"
    
    if tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR"; then
        # Find the actual extracted directory
        EXTRACTED_DIR=$(find "$EXTRACT_DIR" -type d -name "20*" | head -n1)
        if [[ -n "$EXTRACTED_DIR" ]]; then
            BACKUP_DIR="$EXTRACTED_DIR"
            log_message "Backup extracted to: $BACKUP_DIR"
        else
            log_message "ERROR: Could not find extracted backup directory"
            exit 1
        fi
    else
        log_message "ERROR: Failed to extract backup file"
        exit 1
    fi
fi

# Check if backup directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    log_message "ERROR: Backup directory $BACKUP_DIR not found"
    exit 1
fi

# Confirm restore operation
echo "WARNING: This will restore the database from backup directory: $BACKUP_DIR"
echo "This operation will overwrite existing data in the '$DB_NAME' database."
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    log_message "Restore operation cancelled by user"
    exit 0
fi

# Check if mongodump directory exists
MONGODUMP_DIR="$BACKUP_DIR/cci"
if [[ -d "$MONGODUMP_DIR" ]]; then
    log_message "Restoring from mongodump backup..."
    if mongorestore --db "$DB_NAME" --drop "$MONGODUMP_DIR"; then
        log_message "MongoDB restore completed successfully"
    else
        log_message "ERROR: MongoDB restore failed"
        exit 1
    fi
else
    log_message "No mongodump directory found, attempting JSON restore..."
    
    # Restore from JSON files
    for collection in users events people carousels homesections; do
        json_file="$BACKUP_DIR/${collection}.json"
        if [[ -f "$json_file" ]]; then
            # Check if file has content (not just empty array)
            if [[ -s "$json_file" && "$(cat "$json_file" | tr -d ' \n\r')" != "[]" ]]; then
                log_message "Restoring $collection collection..."
                if mongoimport --db "$DB_NAME" --collection "$collection" --file "$json_file" --jsonArray --drop; then
                    log_message "$collection collection restored successfully"
                else
                    log_message "ERROR: Failed to restore $collection collection"
                fi
            else
                log_message "Skipping $collection collection (empty or no data)"
            fi
        else
            log_message "WARNING: JSON file for $collection not found: $json_file"
        fi
    done
fi

# Clean up temporary extraction directory
if [[ -n "$EXTRACT_DIR" && -d "$EXTRACT_DIR" ]]; then
    log_message "Cleaning up temporary files..."
    rm -rf "$EXTRACT_DIR"
fi

log_message "Restore operation completed!"
log_message "Log file: $LOG_FILE"

# Verify restore
log_message "Verifying restore..."
mongosh --eval "db = db.getSiblingDB('$DB_NAME'); print('Collections:'); db.getCollectionNames().forEach(function(name) { print('- ' + name + ': ' + db.getCollection(name).countDocuments() + ' documents'); });" --quiet

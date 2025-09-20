# DAMS Database Backup and Documentation

This directory contains backup scripts, data exports, and documentation for the DAMS (Digital Asset Management System) MongoDB database.

**Database**: `dams`  
**Status**: ✅ Fully configured and tested

## Directory Structure

```
backups/
├── README.md                           # This file
├── backup_script.sh                    # Automated backup script
├── dams_physical_data_model.drawio     # Physical data model diagram
├── restore_script.sh                   # Database restore script
└── [timestamped_backup_directories]/   # Generated backup files
```

## Database Schema Overview

The DAMS system uses MongoDB with the following collections:

### 1. Users Collection (`users`)
- **Purpose**: User authentication and authorization
- **Key Fields**: `_id`, `userId`, `firstName`, `lastName`, `password`, `role`, `status`
- **Relationships**: Self-referencing (approvalDetails.approvedBy)
- **Indexes**: `userId` (unique), `role + status` (compound), `approvalDetails.approvedBy`

### 2. Events Collection (`events`)
- **Purpose**: Event management and scheduling
- **Key Fields**: `_id`, `title`, `description`, `date`, `time`, `address`, `creator`
- **Relationships**: References `users._id` (creator)
- **Indexes**: `creator`, `status`, `date`, `category`, `eventType`, `tags`, `visibility`

### 3. People Collection (`people`)
- **Purpose**: Church member and staff directory
- **Key Fields**: `_id`, `firstName`, `lastName`, `churchRole`, `creator`
- **Relationships**: References `users._id` (creator)
- **Indexes**: `creator`, `status`, `role`, `churchMinistry`, `skills`, `contactInfo.email`

### 4. Carousel Collection (`carousels`)
- **Purpose**: Homepage carousel/slider management
- **Key Fields**: `_id`, `title`, `description`, `type`, `image`, `order`
- **Relationships**: References `users._id` (creator)
- **Indexes**: `order + isActive` (compound), `status`

### 5. HomeSections Collection (`homesections`)
- **Purpose**: Homepage section configuration
- **Key Fields**: `_id`, `order`, `title`, `description`, `backgroundImage`, `tileImage`
- **Indexes**: `order` (unique)

## Backup Procedures

### Automated Backup
Run the automated backup script:
```bash
./backup_script.sh
```

This script will:
1. Check if MongoDB is running
2. Create a timestamped backup directory
3. Export all collections using `mongodump`
4. Create JSON exports for each collection using `mongoexport`
5. Generate backup metadata
6. Create a compressed archive
7. Clean up temporary files

### Manual Backup
If you need to create a backup manually:

```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# MongoDB dump
mongodump --db cci --out backups/$(date +%Y%m%d_%H%M%S)

# Individual collection exports
mongoexport --db cci --collection users --out backups/users.json --jsonArray
mongoexport --db cci --collection events --out backups/events.json --jsonArray
mongoexport --db cci --collection people --out backups/people.json --jsonArray
mongoexport --db cci --collection carousels --out backups/carousels.json --jsonArray
mongoexport --db cci --collection homesections --out backups/homesections.json --jsonArray
```

## Restore Procedures

### From mongodump
```bash
mongorestore --db cci backups/[backup_directory]/cci/
```

### From JSON exports
```bash
mongoimport --db cci --collection users --file backups/users.json --jsonArray
mongoimport --db cci --collection events --file backups/events.json --jsonArray
mongoimport --db cci --collection people --file backups/people.json --jsonArray
mongoimport --db cci --collection carousels --file backups/carousels.json --jsonArray
mongoimport --db cci --collection homesections --file backups/homesections.json --jsonArray
```

## Data Model Documentation

The physical data model is available in `dams_physical_data_model.drawio`. This file can be opened in:
- Draw.io (https://app.diagrams.net/)
- Lucidchart
- Any tool that supports draw.io format

The diagram shows:
- All collections and their fields
- Data types and constraints
- Relationships between collections
- Indexes for performance optimization
- Field validation rules

## Prerequisites

Before running backup scripts, ensure:
1. MongoDB is installed and running
2. You have appropriate permissions to access the database
3. The database name is `cci` (or update the script accordingly)
4. Required tools are installed: `mongodump`, `mongoexport`, `mongorestore`, `mongoimport`

## Security Considerations

- Backup files may contain sensitive data (passwords, personal information)
- Store backups in a secure location
- Consider encrypting backup files
- Implement proper access controls
- Regularly test restore procedures

## Maintenance

- Schedule regular automated backups
- Monitor backup file sizes and disk space
- Test restore procedures periodically
- Keep backup documentation updated
- Archive old backups as needed

## Troubleshooting

### MongoDB not running
```bash
# Start MongoDB service
brew services start mongodb-community

# Or start manually
mongod --dbpath /usr/local/var/mongodb
```

### Permission issues
Ensure you have appropriate MongoDB user permissions or run as the MongoDB user.

### Connection issues
Check MongoDB connection string and ensure the database is accessible.

## Contact

For questions about the database schema or backup procedures, refer to the DAMS project documentation or contact the development team.

# DAMS Database Schema Documentation

## Overview
The DAMS (Digital Asset Management System) uses MongoDB as its primary database with a collection-based schema design. This document provides detailed information about each collection, their fields, relationships, and constraints.

## Database: `cci`

### Collection: `users`
**Purpose**: User authentication, authorization, and profile management

#### Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Yes | Primary Key | Unique identifier |
| `firstName` | String | Yes | max: 50, trim | User's first name |
| `lastName` | String | Yes | max: 50, trim | User's last name |
| `userId` | String | Yes | unique, uppercase | Generated user ID (e.g., JOHDOE) |
| `password` | String | Yes | min: 8 | Hashed password |
| `role` | String | Yes | enum | User role: pending, editor, admin, superadmin |
| `status` | String | Yes | enum | User status: pending, active, suspended, rejected |
| `profile.phone` | String | No | - | Contact phone number |
| `profile.department` | String | No | - | User's department |
| `profile.bio` | String | No | max: 500 | User biography |
| `profile.avatar` | String | No | - | Avatar image path |
| `profile.socialLinks.linkedin` | String | No | - | LinkedIn profile URL |
| `profile.socialLinks.twitter` | String | No | - | Twitter profile URL |
| `profile.socialLinks.website` | String | No | - | Personal website URL |
| `approvalDetails.approvedBy` | ObjectId | No | FK → users._id | Who approved this user |
| `approvalDetails.approvedAt` | Date | No | - | Approval timestamp |
| `approvalDetails.approvalNotes` | String | No | - | Approval notes |
| `approvalDetails.rejectionReason` | String | No | - | Rejection reason if applicable |
| `lastLogin` | Date | No | - | Last login timestamp |
| `createdAt` | Date | Yes | Auto | Creation timestamp |
| `updatedAt` | Date | Yes | Auto | Last update timestamp |

#### Indexes
- `userId` (unique)
- `role + status` (compound)
- `approvalDetails.approvedBy`

#### Virtual Fields
- `fullName`: Concatenated first and last name

#### Methods
- `comparePassword(candidatePassword)`: Compare password with hash
- `canCreateContent()`: Check if user can create content
- `isAdmin()`: Check if user is admin
- `isSuperAdmin()`: Check if user is super admin
- `isApproved()`: Check if user is approved

---

### Collection: `events`
**Purpose**: Event management, scheduling, and registration

#### Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Yes | Primary Key | Unique identifier |
| `title` | String | Yes | max: 200, trim | Event title |
| `description` | String | Yes | trim | Event description |
| `date` | Date | Yes | - | Event date |
| `time` | String | Yes | - | Event time |
| `address.streetAddress` | String | Yes | max: 200, trim | Street address |
| `address.city` | String | Yes | max: 100, trim | City |
| `address.state` | String | Yes | max: 50, trim | State |
| `address.zipCode` | String | Yes | max: 20, trim | ZIP code |
| `creator` | ObjectId | Yes | FK → users._id | Event creator |
| `status` | String | Yes | enum | Event status: draft, published, cancelled, completed |
| `category` | String | No | max: 200, trim | Event category |
| `eventType` | String | Yes | enum | Type: in-person, virtual, hybrid |
| `maxAttendees` | Number | No | min: 1 | Maximum attendees |
| `registrationRequired` | Boolean | No | default: false | Registration required |
| `eventImage` | String | No | - | Event image path |
| `tags` | [String] | No | max: 100 each | Event tags |
| `metadata.viewCount` | Number | No | default: 0 | View count |
| `metadata.attendeeCount` | Number | No | default: 0 | Attendee count |
| `metadata.registrationCount` | Number | No | default: 0 | Registration count |
| `metadata.lastUpdated` | Date | No | default: now | Last update |
| `visibility` | String | Yes | enum | Visibility: public, private, restricted |
| `recurring.isRecurring` | Boolean | No | default: false | Is recurring event |
| `recurring.frequency` | String | No | enum | Frequency: daily, weekly, monthly, yearly |
| `recurring.endDate` | Date | No | - | Recurrence end date |
| `recurring.daysOfWeek` | [Number] | No | 0-6 | Days of week (0=Sunday) |
| `createdAt` | Date | Yes | Auto | Creation timestamp |
| `updatedAt` | Date | Yes | Auto | Last update timestamp |

#### Indexes
- `creator`
- `status`
- `date`
- `category`
- `eventType`
- `tags`
- `visibility`

#### Virtual Fields
- `formattedDateTime`: Formatted date and time string
- `fullAddress`: Complete address string
- `shortAddress`: City, state only
- `isUpcoming`: Boolean if event is in future
- `isPast`: Boolean if event is in past
- `isToday`: Boolean if event is today

#### Methods
- `incrementViewCount()`: Increment view count
- `canManage(userId)`: Check if user can manage event
- `isPublished()`: Check if event is published
- `isRegistrationOpen()`: Check if registration is open

---

### Collection: `people`
**Purpose**: Church member and staff directory

#### Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Yes | Primary Key | Unique identifier |
| `firstName` | String | Yes | max: 50, trim | First name |
| `lastName` | String | Yes | max: 50, trim | Last name |
| `churchRole` | String | Yes | max: 100, trim | Church role/title |
| `profilePhoto` | String | No | default: '' | Profile photo path |
| `creator` | ObjectId | Yes | FK → users._id | Record creator |
| `status` | String | Yes | enum | Status: active, inactive, archived |
| `role` | String | Yes | enum | Role: Pastor, Leader, Member, Coordinator, Assistant, Volunteer |
| `churchMinistry` | [String] | No | max: 100 each | Ministry affiliations |
| `contactInfo.email` | String | No | trim, lowercase | Email address |
| `contactInfo.phone` | String | No | trim | Phone number |
| `bio` | String | No | trim | Biography |
| `socialLinks.linkedin` | String | No | - | LinkedIn URL |
| `socialLinks.twitter` | String | No | - | Twitter URL |
| `socialLinks.facebook` | String | No | - | Facebook URL |
| `socialLinks.instagram` | String | No | - | Instagram URL |
| `socialLinks.website` | String | No | - | Website URL |
| `skills` | [String] | No | max: 50 each | Skills list |
| `expertise` | [String] | No | max: 100 each | Areas of expertise |
| `metadata.viewCount` | Number | No | default: 0 | Profile view count |
| `metadata.lastUpdated` | Date | No | default: now | Last update |
| `createdAt` | Date | Yes | Auto | Creation timestamp |
| `updatedAt` | Date | Yes | Auto | Last update timestamp |

#### Indexes
- `creator`
- `status`
- `role`
- `churchMinistry`
- `skills`
- `contactInfo.email`

#### Virtual Fields
- `fullName`: Concatenated first and last name
- `displayName`: Full name or church role

#### Methods
- `incrementViewCount()`: Increment view count
- `canManage(userId)`: Check if user can manage person record

---

### Collection: `carousels`
**Purpose**: Homepage carousel/slider management

#### Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Yes | Primary Key | Unique identifier |
| `title` | String | Yes | max: 100 | Carousel item title |
| `description` | String | Yes | max: 500 | Description |
| `type` | String | Yes | enum | Type: image, event |
| `image` | String | Yes | - | Image path |
| `eventDate` | String | Yes* | - | Event date (required if type=event) |
| `eventTime` | String | Yes* | - | Event time (required if type=event) |
| `order` | Number | Yes | min: 1 | Display order |
| `isActive` | Boolean | No | default: true | Is active |
| `creator` | ObjectId | Yes | FK → users._id | Creator |
| `status` | String | Yes | enum | Status: active, inactive, draft |
| `createdAt` | Date | Yes | Auto | Creation timestamp |
| `updatedAt` | Date | Yes | Auto | Last update timestamp |

*Required only when type is 'event'

#### Indexes
- `order + isActive` (compound)
- `status`

---

### Collection: `homesections`
**Purpose**: Homepage section configuration

#### Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Yes | Primary Key | Unique identifier |
| `order` | Number | Yes | min: 1, max: 6, unique | Section order |
| `title` | String | Yes | max: 100 | Section title |
| `description` | String | Yes | max: 500 | Section description |
| `backgroundImage` | String | No | - | Background image path |
| `tileImage` | String | No | - | Tile image path |
| `backgroundImageFile` | String | No | default: null | Background image file |
| `tileImageFile` | String | No | default: null | Tile image file |
| `isActive` | Boolean | No | default: true | Is active |
| `createdAt` | Date | Yes | Auto | Creation timestamp |
| `updatedAt` | Date | Yes | Auto | Last update timestamp |

#### Indexes
- `order` (unique)

---

## Relationships

### User Relationships
- **Users → Events**: One-to-Many (creator)
- **Users → People**: One-to-Many (creator)
- **Users → Carousels**: One-to-Many (creator)
- **Users → Users**: One-to-Many (approvalDetails.approvedBy)

### Data Flow
1. Users are created and must be approved by existing users
2. Approved users can create events, people records, and carousel items
3. Events can be associated with people through ministry sections
4. Carousel items can reference events or be standalone images
5. Home sections are configured independently for homepage layout

## Security Considerations

### Authentication
- Passwords are hashed using bcrypt with salt rounds of 12
- User IDs are generated from names and must be unique
- Role-based access control with four levels: pending, editor, admin, superadmin

### Authorization
- Content creators must have active status and appropriate role
- Self-referencing approval system for user management
- Event and people records can only be managed by authorized users

### Data Validation
- String fields have appropriate length limits
- Enum fields restrict values to predefined options
- Required fields are enforced at the schema level
- Email addresses are normalized to lowercase

## Performance Optimization

### Indexing Strategy
- Primary keys are automatically indexed
- Compound indexes for common query patterns
- Text indexes for searchable fields
- Sparse indexes for optional fields

### Query Optimization
- Virtual fields reduce data processing
- Pre-save middleware for automatic timestamp updates
- Static methods for common queries
- Population of referenced documents for related data

## Maintenance

### Regular Tasks
- Monitor index usage and performance
- Clean up inactive records
- Archive old events and people records
- Update user roles and permissions as needed

### Backup Strategy
- Daily automated backups
- JSON exports for each collection
- Compressed archives for long-term storage
- Regular restore testing

## Migration Considerations

### Schema Changes
- Additive changes are generally safe
- Field renames require data migration
- Index changes may require downtime
- Always test changes in development first

### Data Migration
- Use MongoDB migration scripts
- Test with production data copies
- Plan for rollback procedures
- Document all changes


# Home Sections API Documentation

## Overview
The Home Sections API manages the four content sections displayed on the home page below the carousel. Each section includes a background image, tile image, title, and description.

## Database Schema

### HomeSection Model
```javascript
{
  order: Number,           // Required: 1-4, unique
  title: String,           // Required: max 100 chars
  description: String,     // Required: max 500 chars
  backgroundImage: String, // Required: URL to background image
  tileImage: String,       // Required: URL to tile image
  isActive: Boolean,       // Default: true
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-updated
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### GET /api/home-sections
- **Description**: Fetch all active home sections
- **Response**: Array of active home sections sorted by order
- **Example Response**:
```json
[
  {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "order": 1,
    "title": "Welcome to Our Community",
    "description": "Join us in building a vibrant...",
    "backgroundImage": "/uploads/home-sections/section1-bg.jpg",
    "tileImage": "/uploads/home-sections/section1-tile.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Protected Endpoints (Admin/Editor Authentication Required)

#### GET /api/home-sections/admin
- **Description**: Fetch all home sections (including inactive ones)
- **Headers**: `Authorization: Bearer <token>`
- **Access**: Admin and Editor users only

#### POST /api/home-sections
- **Description**: Create a new home section
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "order": 1,
  "title": "Section Title",
  "description": "Section description...",
  "backgroundImage": "/uploads/image.jpg",
  "tileImage": "/uploads/tile.jpg",
  "isActive": true
}
```

#### PUT /api/home-sections/:id
- **Description**: Update an existing home section
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as POST (all fields optional for update)

#### DELETE /api/home-sections/:id
- **Description**: Delete a home section
- **Headers**: `Authorization: Bearer <token>`

#### PATCH /api/home-sections/:id/toggle
- **Description**: Toggle the active status of a home section
- **Headers**: `Authorization: Bearer <token>`

## Seeding Data

### Run the Seeding Script
```bash
cd server
node seedHomeSections.js
```

This will create 4 sample home sections with placeholder image paths.

### Sample Data Structure
The seeding script creates sections with:
1. **Welcome to Our Community** - Community building focus
2. **Spiritual Growth & Learning** - Educational programs
3. **Community Service & Outreach** - Service initiatives
4. **Events & Celebrations** - Community events

## Image Requirements

### Background Images
- **Purpose**: Full section background
- **Recommended Size**: 1920x1080 or larger
- **Format**: JPG, PNG
- **Storage**: `/uploads/home-sections/` directory

### Tile Images
- **Purpose**: Small image within the section
- **Recommended Size**: 400x300 or similar aspect ratio
- **Format**: JPG, PNG
- **Storage**: `/uploads/home-sections/` directory

## Usage Examples

### Frontend Integration
```javascript
// Fetch home sections for display
const response = await fetch('/api/home-sections');
const sections = await response.json();

// Display sections
sections.forEach(section => {
  // Render section with background image, tile image, title, and description
});
```

### Admin Management
```javascript
// Create new section
const newSection = await fetch('/api/home-sections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    order: 1,
    title: "New Section",
    description: "Section description...",
    backgroundImage: "/uploads/bg.jpg",
    tileImage: "/uploads/tile.jpg"
  })
});
```

## Error Handling

### Common Error Responses
- **400**: Validation error (missing fields, duplicate order)
- **401**: Unauthorized (missing or invalid token)
- **403**: Access denied (insufficient permissions)
- **404**: Section not found
- **500**: Server error

### Validation Rules
- `order` must be between 1 and 4
- `order` must be unique across all sections
- `title` and `description` are required
- `backgroundImage` and `tileImage` are required
- Maximum lengths: title (100 chars), description (500 chars)

## Security Features

- **Authentication Required**: All write operations require valid JWT token
- **Role-Based Access**: Only Admin and Editor users can modify sections
- **Input Validation**: All inputs are validated and sanitized
- **Order Validation**: Prevents duplicate order conflicts
- **Audit Trail**: Tracks creation and update timestamps

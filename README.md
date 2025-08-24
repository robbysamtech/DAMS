# DAMS - Digital Asset Management System

A comprehensive ministry management platform built with modern web technologies, designed to streamline ministry operations through organized content management, role-based access control, and responsive design.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - Secure JWT-based authentication with role-based access control
- **Role Management** - Admin approval workflow for user registration and role assignment
- **Ministry Sections** - Hierarchical organization of ministry groups and activities
- **People Management** - Comprehensive team member profiles with ministry section assignments
- **Event Management** - Complete event creation, scheduling, and management system
- **Responsive Design** - Mobile-first approach with fluid layouts that adapt to all screen sizes

### User Roles
- **Content Creators** - Can create and manage ministry content (admin-approved)
- **Content Consumers** - Can view and interact with ministry content
- **Platform Administrators** - Full system access with user management capabilities

### Technical Features
- **Real-time Responsiveness** - UI maintains consistency during window resizing
- **Modern Architecture** - React frontend with Node.js/Express backend
- **Database Integration** - MongoDB with Mongoose ODM
- **Security** - JWT authentication, rate limiting, input validation
- **File Management** - Image upload and processing capabilities

## 🛠️ Technology Stack

### Frontend
- **React 18+** - Modern React with hooks and functional components
- **React Router** - Client-side routing and navigation
- **CSS3** - Custom properties, Grid, Flexbox for responsive design
- **Responsive Design** - Mobile-first approach with fluid typography

### Backend
- **Node.js 18+** - Server runtime environment
- **Express.js 4+** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling
- **Sharp** - Image processing and optimization

### Development Tools
- **Nodemon** - Development server with auto-restart
- **Concurrently** - Run frontend and backend simultaneously
- **ESLint** - Code quality and consistency

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.17.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (v5.0 or higher)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DAMS
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory based on `env.example`:
```bash
cp env.example .env
```

Update the `.env` file with your configuration:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dams
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:3000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Run the Application

#### Development Mode (Frontend + Backend)
```bash
npm run dev
```

#### Backend Only
```bash
npm run server
```

#### Frontend Only
```bash
npm run client
```

#### Production Build
```bash
npm run build
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 📱 Responsive Design Features

### Fluid Layouts
- CSS Grid and Flexbox for adaptive layouts
- No fixed breakpoints - smooth scaling across all screen sizes
- Real-time window resizing support

### Mobile-First Approach
- Touch-friendly interface elements
- Optimized navigation for mobile devices
- Consistent functionality across all device types

### CSS Custom Properties
- Dynamic theming and color management
- Fluid typography and spacing
- Responsive component sizing

## 🔐 Authentication & Security

### User Registration Flow
1. User registers with basic information
2. Account status: "Pending Admin Approval"
3. Admin reviews and assigns role (Creator/Consumer)
4. Account activated with appropriate permissions

### Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Input validation and sanitization
- Role-based access control

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin
- `GET /api/admin/pending-users` - Get pending registrations
- `PUT /api/admin/users/:id/approve` - Approve/reject users
- `GET /api/admin/statistics` - System statistics

### Ministry Sections
- `GET /api/ministry` - Get all sections
- `POST /api/ministry` - Create new section
- `PUT /api/ministry/:id` - Update section
- `DELETE /api/ministry/:id` - Delete section

### People
- `GET /api/people` - Get all people
- `POST /api/people` - Create new person
- `PUT /api/people/:id` - Update person
- `DELETE /api/people/:id` - Delete person

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## 🏗️ Project Structure

```
DAMS/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── index.js       # Entry point
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   ├── uploads/           # File uploads
│   └── index.js           # Server entry point
├── .env                   # Environment variables
├── package.json           # Root dependencies
└── README.md              # Project documentation
```

## 🔧 Development

### Code Style
- ESLint configuration for consistent code quality
- Prettier formatting for clean, readable code
- Component-based architecture for maintainability

### Testing
- Unit testing setup with Jest
- Component testing with React Testing Library
- API testing with Supertest (planned)

### Database
- MongoDB with Mongoose schemas
- Indexed queries for performance
- Data validation and sanitization

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set secure JWT secret
- Configure CORS origins

### Recommended Hosting
- **Backend**: AWS EC2, Google Cloud, or Azure
- **Database**: MongoDB Atlas or self-hosted
- **Frontend**: AWS S3, Netlify, or Vercel
- **CDN**: CloudFront, Cloud CDN, or similar

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the requirements specification

## 🔮 Roadmap

### Phase 2
- Advanced search and filtering
- Workflow automation
- Analytics dashboard
- Mobile application

### Phase 3
- Machine learning integration
- Advanced security features
- Multi-tenant support
- API marketplace

---

**Built with ❤️ for modern ministry organizations**

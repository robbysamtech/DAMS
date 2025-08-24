# DAMS Web Application

A modern full-stack web application built with React frontend and Node.js/Express backend.

## Features

- 🚀 **Modern Frontend**: Built with React 18 and modern CSS
- 🔧 **Backend API**: Express.js server with RESTful endpoints
- 📱 **Responsive Design**: Mobile-first approach with modern UI/UX
- 🔄 **Real-time Data**: Dynamic data fetching and form submission
- 🎨 **Beautiful UI**: Clean, professional design with CSS variables

## Project Structure

```
DAMS/
├── server/                 # Backend server files
│   └── index.js           # Express server with API endpoints
├── client/                 # React frontend application
│   ├── public/            # Static files
│   │   └── index.html     # Main HTML file
│   ├── src/               # React source code
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Component-specific styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   └── package.json       # Frontend dependencies
├── package.json            # Backend dependencies and scripts
└── README.md              # This file
```

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd DAMS
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

   This will install both backend and frontend dependencies.

## Running the Application

### Development Mode (Recommended)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Production Mode

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm start` - Start the production server
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install all dependencies

## API Endpoints

### GET `/api/health`
Health check endpoint that returns server status.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running!"
}
```

### GET `/api/data`
Returns sample data items.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Item 1",
    "description": "This is the first item"
  },
  {
    "id": 2,
    "name": "Item 2",
    "description": "This is the second item"
  }
]
```

### POST `/api/submit`
Handles form submissions.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, this is a test message!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully!",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, this is a test message!"
  }
}
```

## Frontend Features

### Navigation
- **Home**: Welcome page with feature highlights
- **Data**: Displays data fetched from the backend API
- **Contact**: Contact form that submits to the backend

### Responsive Design
- Mobile-first approach
- CSS Grid and Flexbox layouts
- CSS custom properties (variables)
- Modern hover effects and transitions

## Backend Features

- Express.js server with middleware
- CORS enabled for cross-origin requests
- JSON body parsing
- Static file serving for production builds
- Error handling and validation

## Development

### Adding New API Endpoints

1. Add new routes in `server/index.js`
2. Test with tools like Postman or curl
3. Update frontend to consume new endpoints

### Styling Changes

- Global styles: `client/src/index.css`
- Component-specific styles: `client/src/App.css`
- Use CSS variables for consistent theming

### Adding New Components

1. Create new component files in `client/src/`
2. Import and use in `App.js`
3. Add corresponding styles

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
- Change the port in `server/index.js` (line 8)
- Update the proxy in `client/package.json` if needed

### Dependencies Issues
If you encounter dependency issues:
```bash
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
npm run install-all
```

### Build Issues
If the build fails:
```bash
cd client
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue in the repository or contact the development team.

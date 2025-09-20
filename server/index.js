const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Import models
const User = require('./models/User');

const Person = require('./models/Person');
const Event = require('./models/Event');

// Import middleware
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const peopleRoutes = require('./routes/people');
const eventsRoutes = require('./routes/events');
const uploadRoutes = require('./routes/upload');
const carouselRoutes = require('./routes/carousel');
const homeSectionRoutes = require('./routes/homeSections');
const easterMinistryRoutes = require('./routes/easterMinistry');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - more permissive for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));



// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));
app.use(express.static(path.join(__dirname, '../client/build')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dams', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {})
.catch(err => {});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', auth, adminAuth, adminRoutes);

app.use('/api/people', peopleRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/upload', auth, uploadRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/home-sections', homeSectionRoutes);
app.use('/api/easter-ministry', easterMinistryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CCI Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
});

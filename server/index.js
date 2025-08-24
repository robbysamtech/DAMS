const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

app.get('/api/data', (req, res) => {
  const sampleData = [
    { id: 1, name: 'Item 1', description: 'This is the first item' },
    { id: 2, name: 'Item 2', description: 'This is the second item' },
    { id: 3, name: 'Item 3', description: 'This is the third item' }
  ];
  res.json(sampleData);
});

app.post('/api/submit', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // In a real app, you would save this to a database
  console.log('Form submission:', { name, email, message });
  
  res.json({ 
    success: true, 
    message: 'Form submitted successfully!',
    data: { name, email, message }
  });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

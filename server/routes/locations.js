const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// GET all active locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({ name: 1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;

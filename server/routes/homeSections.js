const express = require('express');
const router = express.Router();
const HomeSection = require('../models/HomeSection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// GET all home sections (public - no auth required)
router.get('/', async (req, res) => {
  try {
    const sections = await HomeSection.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching home sections:', error);
    res.status(500).json({ message: 'Failed to fetch home sections' });
  }
});

// GET all home sections (admin/editor only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isEditor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sections = await HomeSection.find()
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching home sections for admin:', error);
    res.status(500).json({ message: 'Failed to fetch home sections' });
  }
});

// POST new home section (admin/editor only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isEditor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { order, title, description, backgroundImage, tileImage, isActive } = req.body;

    // Validate required fields
    if (!order || !title || !description || !backgroundImage || !tileImage) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if order already exists
    const existingSection = await HomeSection.findOne({ order });
    if (existingSection) {
      return res.status(400).json({ message: 'Section with this order already exists' });
    }

    const newSection = new HomeSection({
      order,
      title,
      description,
      backgroundImage,
      tileImage,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedSection = await newSection.save();
    res.status(201).json(savedSection);
  } catch (error) {
    console.error('Error creating home section:', error);
    res.status(500).json({ message: 'Failed to create home section' });
  }
});

// PUT update home section (admin/editor only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isEditor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { order, title, description, backgroundImage, tileImage, isActive } = req.body;
    const sectionId = req.params.id;

    // Check if section exists
    const existingSection = await HomeSection.findById(sectionId);
    if (!existingSection) {
      return res.status(404).json({ message: 'Home section not found' });
    }

    // If changing order, check if new order conflicts with existing section
    if (order && order !== existingSection.order) {
      const conflictingSection = await HomeSection.findOne({ order, _id: { $ne: sectionId } });
      if (conflictingSection) {
        return res.status(400).json({ message: 'Section with this order already exists' });
      }
    }

    const updatedSection = await HomeSection.findByIdAndUpdate(
      sectionId,
      {
        order,
        title,
        description,
        backgroundImage,
        tileImage,
        isActive
      },
      { new: true, runValidators: true }
    );

    res.json(updatedSection);
  } catch (error) {
    console.error('Error updating home section:', error);
    res.status(500).json({ message: 'Failed to update home section' });
  }
});

// DELETE home section (admin/editor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isEditor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sectionId = req.params.id;
    const deletedSection = await HomeSection.findByIdAndDelete(sectionId);
    
    if (!deletedSection) {
      return res.status(404).json({ message: 'Home section not found' });
    }

    res.json({ message: 'Home section deleted successfully' });
  } catch (error) {
    console.error('Error deleting home section:', error);
    res.status(500).json({ message: 'Failed to delete home section' });
  }
});

// PATCH toggle section active status (admin/editor only)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isEditor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sectionId = req.params.id;
    const section = await HomeSection.findById(sectionId);
    
    if (!section) {
      return res.status(404).json({ message: 'Home section not found' });
    }

    section.isActive = !section.isActive;
    const updatedSection = await section.save();

    res.json(updatedSection);
  } catch (error) {
    console.error('Error toggling home section status:', error);
    res.status(500).json({ message: 'Failed to toggle home section status' });
  }
});

module.exports = router;

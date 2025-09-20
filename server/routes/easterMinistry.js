const express = require('express');
const router = express.Router();
const EasterMinistrySection = require('../models/EasterMinistrySection');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/easter-ministry/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'easter-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/easter-ministry - Get all active Easter Ministry sections (public)
router.get('/', async (req, res) => {
  try {
    const sections = await EasterMinistrySection
      .find({ isActive: true })
      .sort({ order: 1 })
      .select('-creator -metadata.viewCount -__v');
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching Easter Ministry sections:', error);
    res.status(500).json({ error: 'Failed to fetch Easter Ministry sections.' });
  }
});

// GET /api/easter-ministry/admin - Get all Easter Ministry sections (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to view admin data.' });
    }

    const sections = await EasterMinistrySection
      .find()
      .sort({ order: 1 })
      .populate('creator', 'firstName lastName');
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching Easter Ministry sections for admin:', error);
    res.status(500).json({ error: 'Failed to fetch Easter Ministry sections.' });
  }
});

// POST /api/easter-ministry - Create new Easter Ministry section
router.post('/', auth, upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'tileImage', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create Easter Ministry sections.' });
    }

    const {
      order,
      title,
      description,
      isActive
    } = req.body;

    // Check if order already exists
    const existingSection = await EasterMinistrySection.findOne({ order: parseInt(order) });
    if (existingSection) {
      return res.status(400).json({ error: 'A section with this order already exists.' });
    }

    const sectionData = {
      order: parseInt(order),
      title,
      description,
      isActive: isActive === 'true' || isActive === true,
      creator: req.user._id
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.backgroundImage && req.files.backgroundImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.backgroundImage[0].path);
        sectionData.backgroundImage = relativePath;
      }
      if (req.files.tileImage && req.files.tileImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.tileImage[0].path);
        sectionData.tileImage = relativePath;
      }
    }

    const section = new EasterMinistrySection(sectionData);
    await section.save();

    const populatedSection = await section.populate('creator', 'firstName lastName');

    res.status(201).json({
      message: 'Easter Ministry section created successfully!',
      section: populatedSection
    });
  } catch (error) {
    console.error('Error creating Easter Ministry section:', error);
    res.status(500).json({ error: 'Failed to create Easter Ministry section.' });
  }
});

// PUT /api/easter-ministry/:id - Update Easter Ministry section
router.put('/:id', auth, upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'tileImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      order,
      title,
      description,
      isActive
    } = req.body;

    const section = await EasterMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Easter Ministry section not found.' });
    }

    // Check if user can manage this section
    if (!(await section.canManage(req.user._id)) && !req.user.isAdmin()) {
      return res.status(403).json({ error: 'You do not have permission to edit this Easter Ministry section.' });
    }

    const updates = {};
    if (order !== undefined) {
      const newOrder = parseInt(order);
      // Check if new order conflicts with existing section
      if (newOrder !== section.order) {
        const existingSection = await EasterMinistrySection.findOne({ 
          order: newOrder, 
          _id: { $ne: req.params.id } 
        });
        if (existingSection) {
          return res.status(400).json({ error: 'A section with this order already exists.' });
        }
      }
      updates.order = newOrder;
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;

    // Handle file uploads
    if (req.files) {
      if (req.files.backgroundImage && req.files.backgroundImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.backgroundImage[0].path);
        updates.backgroundImage = relativePath;
      }
      if (req.files.tileImage && req.files.tileImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.tileImage[0].path);
        updates.tileImage = relativePath;
      }
    }

    updates['metadata.lastUpdated'] = new Date();

    const updatedSection = await EasterMinistrySection.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'firstName lastName');

    res.json({
      message: 'Easter Ministry section updated successfully!',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error updating Easter Ministry section:', error);
    res.status(500).json({ error: 'Failed to update Easter Ministry section.' });
  }
});

// DELETE /api/easter-ministry/:id - Delete Easter Ministry section
router.delete('/:id', auth, async (req, res) => {
  try {
    const section = await EasterMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Easter Ministry section not found.' });
    }

    // Check if user can manage this section
    if (!(await section.canManage(req.user._id)) && !req.user.isAdmin()) {
      return res.status(403).json({ error: 'You do not have permission to delete this Easter Ministry section.' });
    }

    await EasterMinistrySection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Easter Ministry section deleted successfully!' });
  } catch (error) {
    console.error('Error deleting Easter Ministry section:', error);
    res.status(500).json({ error: 'Failed to delete Easter Ministry section.' });
  }
});

module.exports = router;

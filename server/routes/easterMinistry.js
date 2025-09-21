const express = require('express');
const router = express.Router();
const EasterMinistrySection = require('../models/EasterMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processImage, generateThumbnail } = require('../utils/fileUpload');

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
      .find({})
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

    const { order, title, description } = req.body;// Check if order already exists
    const existingSection = await EasterMinistrySection.findOne({ order: parseInt(order) });
    if (existingSection) {
      return res.status(400).json({ error: 'A section with this order already exists.' });
    }

    const sectionData = {
      order: parseInt(order),
      title,
      description,
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
    const { order, title, description } = req.body;const section = await EasterMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Easter Ministry section not found.' });
    }

    // Check if user can manage this section (editor/admin/superadmin can manage sections)
    const canManage = await section.canManage(req.user._id);
    const isEditorOrAdmin = req.user.role === 'editor' || req.user.role === 'admin' || req.user.role === 'superadmin';
    
    if (!canManage && !isEditorOrAdmin) {
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
    // Handle file uploads
    if (req.files) {
      if (req.files.backgroundImage && req.files.backgroundImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.backgroundImage[0].path);
        updates.backgroundImage = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      }
      if (req.files.tileImage && req.files.tileImage[0]) {
        const relativePath = path.relative(path.join(__dirname, '..'), req.files.tileImage[0].path);
        updates.tileImage = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
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

    // Check if user can manage this section (editor/admin/superadmin can manage sections)
    const canManage = await section.canManage(req.user._id);
    const isEditorOrAdmin = req.user.role === 'editor' || req.user.role === 'admin' || req.user.role === 'superadmin';
    
    if (!canManage && !isEditorOrAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this Easter Ministry section.' });
    }

    await EasterMinistrySection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Easter Ministry section deleted successfully!' });
  } catch (error) {
    console.error('Error deleting Easter Ministry section:', error);
    res.status(500).json({ error: 'Failed to delete Easter Ministry section.' });
  }
});

// PATCH upload tile image (admin/editor only)
router.patch('/:id/tile-image', auth, (req, res, next) => {
  console.log('PATCH tile-image middleware - before multer');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  next();
}, upload.single('tileImage'), (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({ 
      error: 'File upload error',
      message: err.message 
    });
  }
  next();
}, async (req, res) => {
  try {
    console.log('PATCH tile-image request received for section:', req.params.id);
    console.log('Request file:', req.file);
    console.log('User role:', req.user.role);
    
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ message: 'No image file provided' });
    }

    const sectionId = req.params.id;
    const section = await EasterMinistrySection.findById(sectionId);
    console.log('Section found:', section);
    
    if (!section) {
      return res.status(404).json({ message: 'Easter Ministry section not found' });
    }

    // Delete old image if it exists
    if (section.tileImageFile && fs.existsSync(section.tileImageFile)) {
      fs.unlinkSync(section.tileImageFile);
    }

    // Process the uploaded image
    const processedImagePath = await processImage(req.file.path, {
      width: 400,
      height: 300,
      quality: 80,
      fit: 'cover'
    });

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(processedImagePath, {
      width: 200,
      height: 150,
      quality: 70
    });

    // Convert paths to URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/easter-ministry/${path.basename(processedImagePath)}`;
    const thumbnailUrl = `${baseUrl}/uploads/easter-ministry/${path.basename(thumbnailPath)}`;

    // Update section with new image paths
    section.tileImage = imageUrl;
    section.tileImageFile = processedImagePath;
    const updatedSection = await section.save();

    console.log('Successfully uploaded tile image');
    res.json({
      ...updatedSection.toObject(),
      thumbnailUrl
    });
  } catch (error) {
    console.error('Error in tile-image upload:', error);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: 'Internal server error',
      details: error.message 
    });
  }
});

module.exports = router;

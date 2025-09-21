const express = require('express');
const router = express.Router();
const YouthMinistrySection = require('../models/YouthMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/youthMinistry');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// @route   GET /api/youth-ministry
// @desc    Get all active Youth Ministry sections (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sections = await YouthMinistrySection.findActiveSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/youth-ministry/admin
// @desc    Get all Youth Ministry sections (for admin)
// @access  Private (Admin/Editor)
router.get('/admin', auth, async (req, res) => {
    try {
      console.log('User:', req.user);
      console.log('User role:', req.user.role);
      console.log('User status:', req.user.status);
      console.log('canCreateContent():', req.user.canCreateContent());
      
      // Check if user has admin privileges
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to view admin data.' });
      }
    const sections = await YouthMinistrySection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/youth-ministry
// @desc    Create a new Youth Ministry section
// @access  Private (Admin/Editor)
router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;

  try {
    const newSection = new YouthMinistrySection({
      order,
      title,
      description,
      isActive: isActive === 'true',
      creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/youthMinistry/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/youthMinistry/${req.files['tileImage'][0].filename}` : undefined,
    });

    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/youth-ministry/:id
// @desc    Update a Youth Ministry section
// @access  Private (Admin/Editor)
router.put('/:id', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;

  try {
    let section = await YouthMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Youth Ministry section not found' });
    }

    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    section.isActive = isActive !== undefined ? isActive === 'true' : section.isActive;

    if (req.files && req.files['backgroundImage']) {
      // Delete old image if it exists
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.backgroundImage = `/uploads/youthMinistry/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      // Delete old image if it exists
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.tileImage = `/uploads/youthMinistry/${req.files['tileImage'][0].filename}`;
    }

    section.metadata.updatedAt = Date.now();
    await section.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/youth-ministry/:id
// @desc    Delete a Youth Ministry section
// @access  Private (Admin/Editor)
router.delete('/:id', auth, async (req, res) => {
    try {
      // Check if user can manage this section (editor/admin/superadmin can manage sections)
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to manage this section.' });
      }
    const section = await YouthMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Youth Ministry section not found' });
    }

    // Delete associated images
    if (section.backgroundImage) {
      const imagePath = path.join(__dirname, '..', section.backgroundImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    if (section.tileImage) {
      const imagePath = path.join(__dirname, '..', section.tileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await YouthMinistrySection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Youth Ministry section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

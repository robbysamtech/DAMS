const express = require('express');
const router = express.Router();
const WorshipMinistrySection = require('../models/WorshipMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/worshipMinistry');
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
  }
});

const upload = multer({ storage: storage });
const { processImage, generateThumbnail } = require('../utils/fileUpload');

// Multer configuration for tile image uploads (with processing)
const tileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${config.folderName}-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const tileImageUpload = multer({ 
  storage: tileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/worship-ministry
// @desc    Get all active Worship Ministry sections (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sections = await WorshipMinistrySection.findActiveSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/worship-ministry/admin
// @desc    Get all Worship Ministry sections (for admin)
// @access  Private (Admin/Editor)
router.get('/admin', auth, async (req, res) => {
    try {
      // Check if user has admin privileges
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to view admin data.' });
      }
    const sections = await WorshipMinistrySection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/worship-ministry
// @desc    Create a new Worship Ministry section
// @access  Private (Admin/Editor)
router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description } = req.body;try {
    const newSection = new WorshipMinistrySection({
      order,
      title,
      description,
      creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/worshipMinistry/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/worshipMinistry/${req.files['tileImage'][0].filename}` : undefined
    });

    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/worship-ministry/:id
// @desc    Update a Worship Ministry section
// @access  Private (Admin/Editor)
router.put('/:id', auth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description } = req.body;try {
    // Check if user can manage this section (editor/admin/superadmin can manage sections)
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to manage this section.' });
    }
    let section = await WorshipMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Worship Ministry section not found' });
    }

    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    if (req.files && req.files['backgroundImage']) {
      // Delete old image if it exists
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.backgroundImage = `/uploads/worshipMinistry/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      // Delete old image if it exists
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.tileImage = `/uploads/worshipMinistry/${req.files['tileImage'][0].filename}`;
    }

    section.metadata.updatedAt = Date.now();
    await section.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/worship-ministry/:id
// @desc    Delete a Worship Ministry section
// @access  Private (Admin/Editor)
router.delete('/:id', auth, async (req, res) => {
    try {
      // Check if user can manage this section (editor/admin/superadmin can manage sections)
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to manage this section.' });
      }
    const section = await WorshipMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Worship Ministry section not found' });
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

    await WorshipMinistrySection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Worship Ministry section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/worship-ministry/:id/tile-image
// @desc    Update tile image for a worship-ministry section
// @access  Private (Admin/Editor)
router.patch('/:id/tile-image', auth, (req, res, next) => {
  console.log('PATCH tile-image middleware - before multer');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.get('content-type'));
  next();
}, tileImageUpload.single('tileImage'), async (req, res) => {
  try {
    console.log(`PATCH tile-image request received for section: ${req.params.id}`);
    console.log('Request file:', req.file);

    // Check if user can manage this section
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to manage this section.' });
    }

    const section = await WorshipMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Worship Ministry section not found' });
    }

    console.log('User role:', req.user.role);
    console.log('Section found:', section);

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Delete old tile image if it exists
    if (section.tileImage) {
      const oldImagePath = path.join(__dirname, '..', section.tileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Process the uploaded image
    const processedImagePath = await processImage(req.file.path, uploadsDir, 'worship-ministry');
    const thumbnailPath = await generateThumbnail(processedImagePath, uploadsDir, 'worship-ministry');

    // Update section with new image paths
    section.tileImage = processedImagePath.replace(path.join(__dirname, '..'), '');
    section.metadata.lastUpdated = new Date();
    await section.save();

    console.log('Successfully uploaded tile image');
    res.json(section);
  } catch (err) {
    console.error('Error uploading tile image:', err);
    res.status(500).json({ error: 'File upload error', message: err.message });
  }
});

module.exports = router;

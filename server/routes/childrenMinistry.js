const express = require('express');
const router = express.Router();
const ChildrenMinistrySection = require('../models/ChildrenMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processImage, generateThumbnail } = require('../utils/fileUpload');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/childrenMinistry');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for general uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Multer configuration for tile image uploads (with processing)
const tileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `children-ministry-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
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

router.get('/', async (req, res) => {
  try {
    const sections = await ChildrenMinistrySection.findActiveSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/admin', auth, async (req, res) => {
    try {
      // Check if user has admin privileges
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to view admin data.' });
      }
    const sections = await ChildrenMinistrySection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description } = req.body;try {
    const newSection = new ChildrenMinistrySection({
      order,
      title,
      description,
      creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/childrenMinistry/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/childrenMinistry/${req.files['tileImage'][0].filename}` : undefined
    });

    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description } = req.body;try {
    // Check if user can manage this section (editor/admin/superadmin can manage sections)
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to manage this section.' });
    }
    let section = await ChildrenMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Children Ministry section not found' });
    }

    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    if (req.files && req.files['backgroundImage']) {
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.backgroundImage = `/uploads/childrenMinistry/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      section.tileImage = `/uploads/childrenMinistry/${req.files['tileImage'][0].filename}`;
    }

    section.metadata.updatedAt = Date.now();
    await section.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, async (req, res) => {
    try {
      // Check if user can manage this section (editor/admin/superadmin can manage sections)
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to manage this section.' });
      }
    const section = await ChildrenMinistrySection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ msg: 'Children Ministry section not found' });
    }

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

    await ChildrenMinistrySection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Children Ministry section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/children-ministry/:id/tile-image
// @desc    Update tile image for a children-ministry section
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

    const section = await ChildrenMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Children Ministry section not found' });
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
    const processedImagePath = await processImage(req.file.path, uploadsDir, 'children-ministry');
    const thumbnailPath = await generateThumbnail(processedImagePath, uploadsDir, 'children-ministry');

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


// @route   PATCH /api/childrenMinistry/:id/tile-image
// @desc    Update tile image for a childrenMinistry section
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

    const section = await ChildrenMinistryMinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'childrenMinistry section not found' });
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
    const processedImagePath = await processImage(req.file.path, uploadsDir, 'childrenMinistry');
    const thumbnailPath = await generateThumbnail(processedImagePath, uploadsDir, 'childrenMinistry');

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

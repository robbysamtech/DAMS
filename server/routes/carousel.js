const express = require('express');
const router = express.Router();
const Carousel = require('../models/Carousel');
const auth = require('../middleware/auth');
const carouselAuth = require('../middleware/carouselAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/carousel');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'carousel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/carousel - Get all active carousel items
router.get('/', async (req, res) => {
  try {
    const carouselItems = await Carousel.find({ 
      isActive: true
    })
    .sort({ order: 1 })
    .populate('creator', 'firstName lastName');
    
    res.json(carouselItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carousel items' });
  }
});

// GET /api/carousel/admin - Get all carousel items (admin only)
router.get('/admin', auth, carouselAuth, async (req, res) => {
  try {
    const carouselItems = await Carousel.find()
      .sort({ order: 1 })
      .populate('creator', 'firstName lastName');
    
    res.json(carouselItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carousel items' });
  }
});

// POST /api/carousel - Create new carousel item
router.post('/', auth, carouselAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, eventDate, eventTime, order, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Validate event fields if type is event
    if (type === 'event' && (!eventDate || !eventTime)) {
      return res.status(400).json({ error: 'Event date and time are required for event type' });
    }

    const carouselItem = new Carousel({
      title,
      description,
      type,
      image: `/uploads/carousel/${req.file.filename}`,
      eventDate: type === 'event' ? eventDate : undefined,
      eventTime: type === 'event' ? eventTime : undefined,
      order: parseInt(order),
      isActive: isActive === 'true' || isActive === true,
      creator: req.user._id
    });

    await carouselItem.save();
    
    const populatedItem = await carouselItem.populate('creator', 'firstName lastName');
    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create carousel item' });
  }
});

// PUT /api/carousel/:id - Update carousel item
router.put('/:id', auth, carouselAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, eventDate, eventTime, order, isActive } = req.body;
    
    const carouselItem = await Carousel.findById(req.params.id);
    if (!carouselItem) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }

    // Update fields
    carouselItem.title = title;
    carouselItem.description = description;
    carouselItem.type = type;
    carouselItem.eventDate = type === 'event' ? eventDate : undefined;
    carouselItem.eventTime = type === 'event' ? eventTime : undefined;
    carouselItem.order = parseInt(order);
    carouselItem.isActive = isActive === 'true' || isActive === true;

    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image
      if (carouselItem.image && carouselItem.image !== '/uploads/carousel/default.jpg') {
        const oldImagePath = path.join(__dirname, '..', carouselItem.image.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      carouselItem.image = `/uploads/carousel/${req.file.filename}`;
    }

    await carouselItem.save();
    
    const updatedItem = await carouselItem.populate('creator', 'firstName lastName');
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update carousel item' });
  }
});

// DELETE /api/carousel/:id - Delete carousel item
router.delete('/:id', auth, carouselAuth, async (req, res) => {
  try {
    const carouselItem = await Carousel.findById(req.params.id);
    if (!carouselItem) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }

    // Delete image file
    if (carouselItem.image && carouselItem.image !== '/uploads/carousel/default.jpg') {
      const imagePath = path.join(__dirname, '..', carouselItem.image.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Carousel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Carousel item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete carousel item' });
  }
});

module.exports = router;

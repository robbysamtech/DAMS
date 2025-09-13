const express = require('express');
const Person = require('../models/Person');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'person-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all people with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active', 
      role, 
      churchMinistry, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status };
    if (role) filter.role = role;
    if (churchMinistry) filter.churchMinistry = { $regex: churchMinistry, $options: 'i' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { churchRole: { $regex: search, $options: 'i' } },
        { churchMinistry: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const people = await Person.find(filter)
      .populate('creator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Person.countDocuments(filter);

    res.json({
      people,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + people.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people.' });
  }
});

// Get person by ID
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id)
      .populate('creator', 'firstName lastName');

    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    // Increment view count
    await person.incrementViewCount();

    res.json({ person });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch person.' });
  }
});

// Create new person
router.post('/', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    
    const {
      firstName,
      lastName,
      churchRole,
      role,
      churchMinistry,
      bio
    } = req.body;


    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create people profiles.' });
    }


    const personData = {
      firstName,
      lastName,
      churchRole,
      creator: req.user._id,
      role: role || 'Member',
      churchMinistry: (() => {
        // Handle both array and string formats
        let ministries = Array.isArray(churchMinistry) 
          ? churchMinistry 
          : typeof churchMinistry === 'string' 
            ? churchMinistry.split(',').map(item => item.trim()).filter(item => item.length > 0)
            : churchMinistry;
        
        // Flatten any nested comma-separated strings and remove duplicates
        const flattenedMinistries = [];
        ministries.forEach(ministry => {
          if (ministry.includes(',')) {
            // Split comma-separated strings
            const splitMinistries = ministry.split(',').map(item => item.trim()).filter(item => item.length > 0);
            flattenedMinistries.push(...splitMinistries);
          } else {
            flattenedMinistries.push(ministry);
          }
        });
        
        // Remove duplicates and empty strings
        return [...new Set(flattenedMinistries)].filter(ministry => ministry.length > 0);
      })(),
      bio
    };


    // Add profile photo if uploaded
    if (req.file) {
      // Save only the relative path for the frontend to access
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      personData.profilePhoto = relativePath;
    }

    const person = new Person(personData);
    await person.save();

    const populatedPerson = await person.populate('creator', 'firstName lastName');

    res.status(201).json({
      message: 'Person profile created successfully!',
      person: populatedPerson
    });
  } catch (error) {
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    // Check for other specific errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value' });
    }
    
    res.status(500).json({ error: 'Failed to create person profile.' });
  }
});

// Update person
router.put('/:id', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    
    const {
      firstName,
      lastName,
      churchRole,
      role,
      churchMinistry,
      bio
    } = req.body;
    
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    // Check if user can manage this person
    
    if (!(await person.canManage(req.user._id))) {
      return res.status(403).json({ error: 'You do not have permission to edit this person profile.' });
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (churchRole !== undefined) updates.churchRole = churchRole;
    if (role !== undefined) updates.role = role;
    if (churchMinistry !== undefined) {
      // Handle both array and string formats
      let ministries = Array.isArray(churchMinistry) 
        ? churchMinistry 
        : typeof churchMinistry === 'string' 
          ? churchMinistry.split(',').map(item => item.trim()).filter(item => item.length > 0)
          : churchMinistry;
      
      // Flatten any nested comma-separated strings and remove duplicates
      const flattenedMinistries = [];
      ministries.forEach(ministry => {
        if (ministry.includes(',')) {
          // Split comma-separated strings
          const splitMinistries = ministry.split(',').map(item => item.trim()).filter(item => item.length > 0);
          flattenedMinistries.push(...splitMinistries);
        } else {
          flattenedMinistries.push(ministry);
        }
      });
      
      // Remove duplicates and empty strings
      updates.churchMinistry = [...new Set(flattenedMinistries)].filter(ministry => ministry.length > 0);
    }
    if (bio !== undefined) updates.bio = bio;


    // Handle profile photo update
    if (req.file) {
      // Delete old photo if it exists
      if (person.profilePhoto && person.profilePhoto !== '') {
        try {
          const oldPhotoPath = path.join(__dirname, '..', person.profilePhoto);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        } catch (err) {
        }
      }
      // Save only the relative path for the frontend to access
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      updates.profilePhoto = relativePath;
    }

    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('creator', 'firstName lastName');

    res.json({
      message: 'Person profile updated successfully!',
      person: updatedPerson
    });
  } catch (error) {
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    // Check for other specific errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value' });
    }
    
    res.status(500).json({ error: 'Failed to update person profile.' });
  }
});

// Delete person
router.delete('/:id', auth, async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    // Check if user can manage this person
    if (!(await person.canManage(req.user._id))) {
      return res.status(403).json({ error: 'You do not have permission to delete this person profile.' });
    }

    // Delete profile photo if it exists
    if (person.profilePhoto && person.profilePhoto !== '') {
      try {
        if (fs.existsSync(person.profilePhoto)) {
          fs.unlinkSync(person.profilePhoto);
        }
      } catch (err) {
      }
    }
    
    await Person.findByIdAndDelete(req.params.id);

    res.json({ message: 'Person profile deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete person profile.' });
  }
});

// Get people statistics
router.get('/statistics/overview', async (req, res) => {
  try {
    const [
      totalPeople,
      peopleByRole,
      recentAdditions
    ] = await Promise.all([
      Person.countDocuments({ status: 'active' }),
      Person.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Person.find({ status: 'active' })
        .select('firstName lastName churchRole createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      totalPeople,
      peopleByRole,
      recentAdditions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people statistics.' });
  }
});

module.exports = router;

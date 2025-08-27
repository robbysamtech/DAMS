const express = require('express');
const Person = require('../models/Person');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      department, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status };
    if (role) filter.role = role;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
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
    console.error('Error fetching people:', error);
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
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch person.' });
  }
});

// Create new person
router.post('/', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('POST /api/people - Request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    
    const {
      firstName,
      lastName,
      jobTitle,
      role,
      department,
      bio
    } = req.body;

    console.log('Extracted data:', { firstName, lastName, jobTitle, role, department, bio });

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      console.log('User cannot create content. Role:', req.user.role, 'Status:', req.user.status);
      return res.status(403).json({ error: 'You do not have permission to create people profiles.' });
    }

    console.log('User can create content. Proceeding...');

    const personData = {
      firstName,
      lastName,
      jobTitle,
      creator: req.user._id,
      role: role || 'Member',
      department,
      bio
    };

    console.log('Person data to save:', personData);

    // Add profile photo if uploaded
    if (req.file) {
      // Save only the relative path for the frontend to access
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      personData.profilePhoto = relativePath;
      console.log('Profile photo added:', req.file.path);
      console.log('Relative path saved:', relativePath);
      console.log('File exists check:', fs.existsSync(req.file.path));
      console.log('File stats:', fs.statSync(req.file.path));
    }

    const person = new Person(personData);
    console.log('Person model created, saving...');
    
    await person.save();
    console.log('Person saved successfully:', person._id);

    const populatedPerson = await person.populate('creator', 'firstName lastName');
    console.log('Person populated:', populatedPerson);

    res.status(201).json({
      message: 'Person profile created successfully!',
      person: populatedPerson
    });
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person profile.' });
  }
});

// Update person
router.put('/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('PUT /api/people/:id - Update request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    console.log('Person ID:', req.params.id);
    
    const {
      firstName,
      lastName,
      jobTitle,
      role,
      department,
      bio
    } = req.body;
    
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    // Check if user can manage this person
    console.log('Checking permissions...');
    console.log('Person creator ID:', person.creator);
    console.log('User ID:', req.user._id);
    console.log('Can manage result:', person.canManage(req.user._id));
    
    if (!person.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to edit this person profile.' });
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (bio !== undefined) updates.bio = bio;

    console.log('Updates to apply:', updates);
    console.log('Person found:', person);

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
          console.error('Error deleting old photo:', err);
        }
      }
      // Save only the relative path for the frontend to access
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      updates.profilePhoto = relativePath;
      console.log('Profile photo updated:', req.file.path);
      console.log('Relative path saved:', relativePath);
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
    console.error('Error updating person:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
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
router.delete('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    // Check if user can manage this person
    if (!person.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to delete this person profile.' });
    }

    // Delete profile photo if it exists
    if (person.profilePhoto && person.profilePhoto !== '') {
      try {
        if (fs.existsSync(person.profilePhoto)) {
          fs.unlinkSync(person.profilePhoto);
        }
      } catch (err) {
        console.error('Error deleting profile photo:', err);
      }
    }
    
    await Person.findByIdAndDelete(req.params.id);

    res.json({ message: 'Person profile deleted successfully!' });
  } catch (error) {
    console.error('Error deleting person:', error);
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
        .select('firstName lastName jobTitle createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      totalPeople,
      peopleByRole,
      recentAdditions
    });
  } catch (error) {
    console.error('Error fetching people statistics:', error);
    res.status(500).json({ error: 'Failed to fetch people statistics.' });
  }
});

module.exports = router;

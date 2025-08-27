const express = require('express');
const Person = require('../models/Person');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
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
    const {
      firstName,
      lastName,
      jobTitle,
      role,
      department,
      bio
    } = req.body;

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create people profiles.' });
    }

    const personData = {
      firstName,
      lastName,
      jobTitle,
      creator: req.user._id,
      role: role || 'Member',
      department,
      bio
    };

    // Add profile photo if uploaded
    if (req.file) {
      personData.profilePhoto = req.file.path;
    }

    const person = new Person(personData);
    await person.save();

    const populatedPerson = await person.populate('creator', 'firstName lastName');

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

    // Handle profile photo update
    if (req.file) {
      // Delete old photo if it exists
      if (person.profilePhoto && person.profilePhoto !== '') {
        try {
          if (fs.existsSync(person.profilePhoto)) {
            fs.unlinkSync(person.profilePhoto);
          }
        } catch (err) {
          console.error('Error deleting old photo:', err);
        }
      }
      updates.profilePhoto = req.file.path;
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

const express = require('express');
const Person = require('../models/Person');
const MinistrySection = require('../models/MinistrySection');
const router = express.Router();

// Get all people with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active', 
      ministrySection, 
      role, 
      department, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status };
    if (ministrySection) filter.ministrySection = ministrySection;
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
      .populate('ministrySection', 'name sectionType visualIdentity')
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

// Get people by ministry section
router.get('/section/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { role, search, page = 1, limit = 20 } = req.query;

    const filter = { 
      ministrySection: sectionId, 
      status: 'active' 
    };
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const people = await Person.find(filter)
      .populate('ministrySection', 'name sectionType visualIdentity')
      .populate('creator', 'firstName lastName')
      .sort({ role: 1, firstName: 1, lastName: 1 })
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
    console.error('Error fetching people by section:', error);
    res.status(500).json({ error: 'Failed to fetch people by section.' });
  }
});

// Get person by ID
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id)
      .populate('ministrySection', 'name sectionType description visualIdentity')
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
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      jobTitle,
      ministrySection,
      role,
      department,
      contactInfo,
      bio,
      socialLinks,
      skills,
      expertise,
      sectionResponsibilities
    } = req.body;

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create people profiles.' });
    }

    // Verify ministry section exists
    const section = await MinistrySection.findById(ministrySection);
    if (!section) {
      return res.status(400).json({ error: 'Ministry section not found.' });
    }

    // Check if user can manage this ministry section
    if (!section.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to add people to this ministry section.' });
    }

    const person = new Person({
      firstName,
      lastName,
      jobTitle,
      ministrySection,
      creator: req.user._id,
      role: role || 'Member',
      department,
      contactInfo,
      bio,
      socialLinks,
      skills,
      expertise,
      sectionResponsibilities
    });

    await person.save();

    // Update ministry section member count
    await section.updateMemberCount();

    const populatedPerson = await person.populate([
      { path: 'ministrySection', select: 'name sectionType visualIdentity' },
      { path: 'creator', select: 'firstName lastName' }
    ]);

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
router.put('/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      jobTitle,
      ministrySection,
      role,
      department,
      contactInfo,
      bio,
      socialLinks,
      skills,
      expertise,
      sectionResponsibilities
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
    if (ministrySection !== undefined) updates.ministrySection = ministrySection;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;
    if (bio !== undefined) updates.bio = bio;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    if (skills !== undefined) updates.skills = skills;
    if (expertise !== undefined) updates.expertise = expertise;
    if (sectionResponsibilities !== undefined) updates.sectionResponsibilities = sectionResponsibilities;

    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate([
      { path: 'ministrySection', select: 'name sectionType visualIdentity' },
      { path: 'creator', select: 'firstName lastName' }
    ]);

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

    const ministrySectionId = person.ministrySection;
    
    await Person.findByIdAndDelete(req.params.id);

    // Update ministry section member count
    if (ministrySectionId) {
      const section = await MinistrySection.findById(ministrySectionId);
      if (section) {
        await section.updateMemberCount();
      }
    }

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
      peopleBySection,
      recentAdditions
    ] = await Promise.all([
      Person.countDocuments({ status: 'active' }),
      Person.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Person.aggregate([
        { $match: { status: 'active' } },
        { $lookup: { from: 'ministrysections', localField: 'ministrySection', foreignField: '_id', as: 'section' } },
        { $unwind: '$section' },
        { $group: { _id: '$section.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Person.find({ status: 'active' })
        .select('firstName lastName jobTitle ministrySection createdAt')
        .populate('ministrySection', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      totalPeople,
      peopleByRole,
      peopleBySection,
      recentAdditions
    });
  } catch (error) {
    console.error('Error fetching people statistics:', error);
    res.status(500).json({ error: 'Failed to fetch people statistics.' });
  }
});

module.exports = router;

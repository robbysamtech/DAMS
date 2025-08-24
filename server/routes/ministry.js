const express = require('express');
const MinistrySection = require('../models/MinistrySection');
const Person = require('../models/Person');
const Event = require('../models/Event');
const router = express.Router();

// Get all ministry sections
router.get('/', async (req, res) => {
  try {
    const { status = 'active', parentSection, search, page = 1, limit = 20 } = req.query;
    
    const filter = { status };
    if (parentSection) filter['hierarchy.parentSection'] = parentSection;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sectionType: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const sections = await MinistrySection.find(filter)
      .populate('creator', 'firstName lastName')
      .populate('contactPerson', 'firstName lastName jobTitle')
      .sort({ 'hierarchy.order': 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MinistrySection.countDocuments(filter);

    res.json({
      sections,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + sections.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching ministry sections:', error);
    res.status(500).json({ error: 'Failed to fetch ministry sections.' });
  }
});

// Get ministry section by ID
router.get('/:id', async (req, res) => {
  try {
    const section = await MinistrySection.findById(req.params.id)
      .populate('creator', 'firstName lastName')
      .populate('contactPerson', 'firstName lastName jobTitle profilePhoto');

    if (!section) {
      return res.status(404).json({ error: 'Ministry section not found.' });
    }

    // Get people in this section
    const people = await Person.find({ 
      ministrySection: section._id, 
      status: 'active' 
    }).populate('creator', 'firstName lastName');

    // Get events related to this section
    const events = await Event.find({ 
      relatedMinistrySection: section._id, 
      status: 'published' 
    }).populate('creator', 'firstName lastName');

    res.json({
      section,
      people,
      events
    });
  } catch (error) {
    console.error('Error fetching ministry section:', error);
    res.status(500).json({ error: 'Failed to fetch ministry section.' });
  }
});

// Create new ministry section
router.post('/', async (req, res) => {
  try {
    const { name, description, sectionType, parentSection, color, image, tags } = req.body;

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create ministry sections.' });
    }

    const section = new MinistrySection({
      name,
      description,
      sectionType,
      creator: req.user._id,
      visualIdentity: {
        color: color || '#2563eb'
      },
      tags: tags || []
    });

    if (parentSection) {
      section.hierarchy.parentSection = parentSection;
    }

    if (image) {
      section.visualIdentity.image = image;
    }

    await section.save();

    const populatedSection = await section.populate('creator', 'firstName lastName');

    res.status(201).json({
      message: 'Ministry section created successfully!',
      section: populatedSection
    });
  } catch (error) {
    console.error('Error creating ministry section:', error);
    res.status(500).json({ error: 'Failed to create ministry section.' });
  }
});

// Update ministry section
router.put('/:id', async (req, res) => {
  try {
    const { name, description, sectionType, parentSection, color, image, tags, contactPerson } = req.body;
    
    const section = await MinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Ministry section not found.' });
    }

    // Check if user can manage this section
    if (!section.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to edit this ministry section.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (sectionType) updates.sectionType = sectionType;
    if (parentSection) updates['hierarchy.parentSection'] = parentSection;
    if (color) updates['visualIdentity.color'] = color;
    if (image) updates['visualIdentity.image'] = image;
    if (tags) updates.tags = tags;
    if (contactPerson) updates.contactPerson = contactPerson;

    const updatedSection = await MinistrySection.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('creator', 'firstName lastName')
     .populate('contactPerson', 'firstName lastName jobTitle');

    res.json({
      message: 'Ministry section updated successfully!',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error updating ministry section:', error);
    res.status(500).json({ error: 'Failed to update ministry section.' });
  }
});

// Delete ministry section
router.delete('/:id', async (req, res) => {
  try {
    const section = await MinistrySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Ministry section not found.' });
    }

    // Check if user can manage this section
    if (!section.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to delete this ministry section.' });
    }

    // Check if section has people or events
    const [peopleCount, eventsCount] = await Promise.all([
      Person.countDocuments({ ministrySection: section._id }),
      Event.countDocuments({ relatedMinistrySection: section._id })
    ]);

    if (peopleCount > 0 || eventsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete ministry section. It contains people or events. Please remove them first.' 
      });
    }

    await MinistrySection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Ministry section deleted successfully!' });
  } catch (error) {
    console.error('Error deleting ministry section:', error);
    res.status(500).json({ error: 'Failed to delete ministry section.' });
  }
});

// Get ministry section hierarchy
router.get('/hierarchy/tree', async (req, res) => {
  try {
    const sections = await MinistrySection.find({ status: 'active' })
      .select('name description sectionType hierarchy visualIdentity metadata')
      .sort({ 'hierarchy.level': 1, 'hierarchy.order': 1 });

    // Build hierarchy tree
    const buildTree = (sections, parentId = null) => {
      return sections
        .filter(section => 
          parentId ? section.hierarchy.parentSection?.toString() === parentId.toString() 
                  : !section.hierarchy.parentSection
        )
        .map(section => ({
          ...section.toObject(),
          children: buildTree(sections, section._id)
        }));
    };

    const tree = buildTree(sections);

    res.json({ hierarchy: tree });
  } catch (error) {
    console.error('Error fetching ministry hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch ministry hierarchy.' });
  }
});

// Reorder ministry sections
router.put('/hierarchy/reorder', async (req, res) => {
  try {
    const { sections } = req.body; // Array of { id, order, parentSection }

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid sections data.' });
    }

    // Check if user can manage any of these sections
    const sectionIds = sections.map(s => s.id);
    const existingSections = await MinistrySection.find({ _id: { $in: sectionIds } });
    
    const canManageAll = existingSections.every(section => 
      section.canManage(req.user._id)
    );

    if (!canManageAll) {
      return res.status(403).json({ error: 'You do not have permission to reorder these sections.' });
    }

    // Update sections with new order and parent
    const updatePromises = sections.map(({ id, order, parentSection }) =>
      MinistrySection.findByIdAndUpdate(id, {
        'hierarchy.order': order,
        'hierarchy.parentSection': parentSection || null
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Ministry sections reordered successfully!' });
  } catch (error) {
    console.error('Error reordering ministry sections:', error);
    res.status(500).json({ error: 'Failed to reorder ministry sections.' });
  }
});

module.exports = router;

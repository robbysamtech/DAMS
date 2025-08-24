const express = require('express');
const Event = require('../models/Event');
const MinistrySection = require('../models/MinistrySection');
const router = express.Router();

// Get all events with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'published', 
      category, 
      eventType, 
      ministrySection, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status };
    if (category) filter.category = category;
    if (eventType) filter.eventType = eventType;
    if (ministrySection) filter.relatedMinistrySection = ministrySection;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
      .populate('relatedMinistrySection', 'name sectionType visualIdentity')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10, ministrySection } = req.query;
    
    const filter = {
      status: 'published',
      date: { $gte: new Date() },
      visibility: 'public'
    };
    
    if (ministrySection) {
      filter.relatedMinistrySection = ministrySection;
    }

    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
      .populate('relatedMinistrySection', 'name sectionType visualIdentity')
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit));

    res.json({ events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events.' });
  }
});

// Get events by ministry section
router.get('/section/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { status = 'published', page = 1, limit = 20 } = req.query;

    const filter = { 
      relatedMinistrySection: sectionId, 
      status 
    };

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
      .populate('relatedMinistrySection', 'name sectionType visualIdentity')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events by section:', error);
    res.status(500).json({ error: 'Failed to fetch events by section.' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName profile')
      .populate('relatedMinistrySection', 'name sectionType description visualIdentity');

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Increment view count
    await event.incrementViewCount();

    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event.' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      relatedMinistrySection,
      visibility,
      recurring
    } = req.body;

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create events.' });
    }

    // Verify ministry section exists if provided
    if (relatedMinistrySection) {
      const section = await MinistrySection.findById(relatedMinistrySection);
      if (!section) {
        return res.status(400).json({ error: 'Ministry section not found.' });
      }
      
      // Check if user can manage this ministry section
      if (!section.canManage(req.user._id)) {
        return res.status(403).json({ error: 'You do not have permission to create events for this ministry section.' });
      }
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      creator: req.user._id,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      relatedMinistrySection,
      visibility,
      recurring
    });

    await event.save();

    const populatedEvent = await event.populate([
      { path: 'creator', select: 'firstName lastName' },
      { path: 'relatedMinistrySection', select: 'name sectionType visualIdentity' }
    ]);

    res.status(201).json({
      message: 'Event created successfully!',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      relatedMinistrySection,
      visibility,
      recurring,
      status
    } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if user can manage this event
    if (!event.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to edit this event.' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;
    if (time !== undefined) updates.time = time;
    if (location !== undefined) updates.location = location;
    if (category !== undefined) updates.category = category;
    if (eventType !== undefined) updates.eventType = eventType;
    if (maxAttendees !== undefined) updates.maxAttendees = maxAttendees;
    if (registrationRequired !== undefined) updates.registrationRequired = registrationRequired;
    if (eventImage !== undefined) updates.eventImage = eventImage;
    if (tags !== undefined) updates.tags = tags;
    if (relatedMinistrySection !== undefined) updates.relatedMinistrySection = relatedMinistrySection;
    if (visibility !== undefined) updates.visibility = visibility;
    if (recurring !== undefined) updates.recurring = recurring;
    if (status !== undefined) updates.status = status;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate([
      { path: 'creator', select: 'firstName lastName' },
      { path: 'relatedMinistrySection', select: 'name sectionType visualIdentity' }
    ]);

    res.json({
      message: 'Event updated successfully!',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if user can manage this event
    if (!event.canManage(req.user._id)) {
      return res.status(403).json({ error: 'You do not have permission to delete this event.' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully!' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// Get event statistics
router.get('/statistics/overview', async (req, res) => {
  try {
    const [
      totalEvents,
      eventsByStatus,
      eventsByType,
      eventsByCategory,
      upcomingEventsCount,
      recentEvents
    ] = await Promise.all([
      Event.countDocuments(),
      Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $match: { category: { $exists: true, $ne: '' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Event.countDocuments({
        status: 'published',
        date: { $gte: new Date() }
      }),
      Event.find({ status: 'published' })
        .select('title date location relatedMinistrySection')
        .populate('relatedMinistrySection', 'name')
        .sort({ date: -1 })
        .limit(5)
    ]);

    res.json({
      totalEvents,
      eventsByStatus,
      eventsByType,
      eventsByCategory,
      upcomingEventsCount,
      recentEvents
    });
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    res.status(500).json({ error: 'Failed to fetch event statistics.' });
  }
});

// Search events
router.get('/search/advanced', async (req, res) => {
  try {
    const { 
      query, 
      dateFrom, 
      dateTo, 
      category, 
      eventType, 
      ministrySection,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status: 'published' };
    
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    
    if (category) filter.category = category;
    if (eventType) filter.eventType = eventType;
    if (ministrySection) filter.relatedMinistrySection = ministrySection;

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
      .populate('relatedMinistrySection', 'name sectionType visualIdentity')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'Failed to search events.' });
  }
});

module.exports = router;

const express = require('express');
const fs = require('fs');
const path = require('path');
const Event = require('../models/Event');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all events with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'draft', 
      category, 
      eventType, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (eventType) filter.eventType = eventType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { 'address.streetAddress': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'address.zipCode': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
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
    const { limit = 10 } = req.query;
    
    const filter = {
      status: 'published',
      date: { $gte: new Date() },
      visibility: 'public'
    };

    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit));

    res.json({ events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events.' });
  }
});

// Get events by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { status = 'published', page = 1, limit = 20 } = req.query;

    const filter = { 
      category: category, 
      status 
    };

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
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
    console.error('Error fetching events by category:', error);
    res.status(500).json({ error: 'Failed to fetch events by category.' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName profile')


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
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      address,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      visibility,
      recurring
    } = req.body;

    // Check if user can create content
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to create events.' });
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      address,
      creator: req.user._id,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      visibility,
      recurring
    });

    await event.save();

    const populatedEvent = await event.populate([
      { path: 'creator', select: 'firstName lastName' }
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
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      address,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      eventImage,
      tags,
      visibility,
      recurring,
      status
    } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if user can manage this event
    if (!(await event.canManage(req.user._id))) {
      return res.status(403).json({ error: 'You do not have permission to edit this event.' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;
    if (time !== undefined) updates.time = time;
    if (address !== undefined) updates.address = address;
    if (category !== undefined) updates.category = category;
    if (eventType !== undefined) updates.eventType = eventType;
    if (maxAttendees !== undefined) updates.maxAttendees = maxAttendees;
    if (registrationRequired !== undefined) updates.registrationRequired = registrationRequired;
    if (eventImage !== undefined) updates.eventImage = eventImage;
    if (tags !== undefined) updates.tags = tags;

    if (visibility !== undefined) updates.visibility = visibility;
    if (recurring !== undefined) updates.recurring = recurring;
    if (status !== undefined) updates.status = status;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate([
      { path: 'creator', select: 'firstName lastName' }
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if user can manage this event
    if (!(await event.canManage(req.user._id))) {
      return res.status(403).json({ error: 'You do not have permission to delete this event.' });
    }

    // Delete associated image files if they exist
    if (event.eventImage) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Extract filename from the image URL
        const imageUrl = event.eventImage;
        const filename = path.basename(imageUrl);
        
        // Construct full path to the image file
        const imagePath = path.join(__dirname, '..', 'uploads', filename);
        
        // Check if file exists and delete it
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${filename}`);
        }
        
        // Also try to delete thumbnail if it exists
        const thumbFilename = filename.replace('_processed.jpeg', '_processed_thumb.jpeg');
        const thumbPath = path.join(__dirname, '..', 'uploads', thumbFilename);
        
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log(`Deleted thumbnail file: ${thumbFilename}`);
        }
      } catch (imageError) {
        console.error('Error deleting image files:', imageError);
        // Don't fail the event deletion if image cleanup fails
      }
    }

    // Delete the event from database
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
              .select('title date address')
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
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = { status: 'published' };
    
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { 'address.streetAddress': { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } },
        { 'address.state': { $regex: query, $options: 'i' } },
        { 'address.zipCode': { $regex: query, $options: 'i' } }
      ];
    }
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    
    if (category) filter.category = category;
    if (eventType) filter.eventType = eventType;


    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('creator', 'firstName lastName')
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

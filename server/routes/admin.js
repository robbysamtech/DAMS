const express = require('express');
const User = require('../models/User');
const MinistrySection = require('../models/MinistrySection');
const Person = require('../models/Person');
const Event = require('../models/Event');
const router = express.Router();

// Get all pending user registrations
router.get('/pending-users', async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: 1 });

    res.json({ pendingUsers });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users.' });
  }
});

// Approve user registration
router.put('/users/:userId/approve', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['consumer', 'creator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "consumer" or "creator".' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.status = 'active';
    user.role = role;
    user.approvalDetails = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      approvalNotes: 'Approved by admin'
    };

    await user.save();

    res.json({
      message: 'User approved successfully!',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        approvalDetails: user.approvalDetails
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to process user approval.' });
  }
});

// Reject user registration
router.put('/users/:userId/reject', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.status = 'rejected';
    user.approvalDetails = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectionReason: reason || 'No reason provided'
    };

    await user.save();

    res.json({
      message: 'User rejected successfully!',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        approvalDetails: user.approvalDetails
      }
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to process user rejection.' });
  }
});

// Get all users with filtering
router.get('/users', async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Update user role or status
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status, notes } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (notes) {
      updates.approvalDetails = {
        approvedBy: req.user._id,
        approvedAt: new Date(),
        approvalNotes: notes
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'User updated successfully!',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Suspend or terminate user account
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended', 'terminated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status,
        'approvalDetails.notes': reason || `Account ${status} by admin`
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: `User account ${status} successfully!`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      activeUsers,
      totalMinistrySections,
      totalPeople,
      totalEvents
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'active' }),
      MinistrySection.countDocuments({ status: 'active' }),
      Person.countDocuments({ status: 'active' }),
      Event.countDocuments({ status: 'published' })
    ]);

    const userStats = {
      total: totalUsers,
      pending: pendingUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers - pendingUsers
    };

    const contentStats = {
      ministrySections: totalMinistrySections,
      people: totalPeople,
      events: totalEvents
    };

    res.json({
      userStats,
      contentStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentUsers = await User.find()
      .select('firstName lastName email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const recentSections = await MinistrySection.find()
      .select('name sectionType creator createdAt')
      .populate('creator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const recentPeople = await Person.find()
      .select('jobTitle ministrySection creator createdAt')
      .populate('ministrySection', 'name')
      .populate('creator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const recentEvents = await Event.find()
      .select('title date creator createdAt')
      .populate('creator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      recentUsers,
      recentSections,
      recentPeople,
      recentEvents
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity.' });
  }
});

module.exports = router;

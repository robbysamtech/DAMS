const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, userId, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !userId || !password) {
      return res.status(400).json({ error: 'First name, last name, user ID, and password are required.' });
    }

    // Check if user ID already exists
    const userIdExists = await User.userIdExists(userId);
    if (userIdExists) {
      return res.status(400).json({ error: 'This User ID is already taken. Please choose a different one.' });
    }

    // Create new user (pending approval)
    const user = new User({
      firstName,
      lastName,
      userId,
      password,
      role: 'pending',
      status: 'pending'
    });

    await user.save();

    // Return the user ID for display
      res.status(201).json({ 
        message: 'Editor access request sent! An administrator will review your request.', 
        userId: user.userId,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          userId: user.userId,
          role: user.role,
          status: user.status
        }
      });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Find user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid user ID or password.' });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(401).json({ 
        error: 'Account is not active. Please contact an administrator for approval.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid user ID or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user.userId,
        role: user.role,
        status: user.status,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get Current User Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update User Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, department, bio, socialLinks } = req.body;
    
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates['profile.phone'] = phone;
    if (department) updates['profile.department'] = department;
    if (bio) updates['profile.bio'] = bio;
    if (socialLinks) updates['profile.socialLinks'] = socialLinks;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'Profile updated successfully!',
      user 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change Password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Check if User ID is available
router.post('/check-user-id', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const exists = await User.userIdExists(userId);
    res.json({ available: !exists });
  } catch (error) {
    console.error('User ID check error:', error);
    res.status(500).json({ error: 'Failed to check user ID availability.' });
  }
});

// Generate User ID from name
router.post('/generate-user-id', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }

    const userId = User.generateUserIdFromName(firstName, lastName);
    res.json({ userId });
  } catch (error) {
    console.error('User ID generation error:', error);
    res.status(500).json({ error: 'Failed to generate user ID.' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully!' });
});

module.exports = router;

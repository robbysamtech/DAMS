const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  churchRole: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['Pastor', 'Leader', 'Member', 'Coordinator', 'Assistant', 'Volunteer'],
    default: 'Member'
  },
  churchMinistry: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  bio: {
    type: String,
    trim: true
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    website: String
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  expertise: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  metadata: {
    viewCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
personSchema.index({ creator: 1 });
personSchema.index({ status: 1 });
personSchema.index({ role: 1 });
personSchema.index({ churchMinistry: 1 });
personSchema.index({ skills: 1 });
personSchema.index({ 'contactInfo.email': 1 });

// Virtual for full name
personSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || 'Unknown';
});

// Virtual for display name
personSchema.virtual('displayName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.churchRole;
});

// Method to increment view count
personSchema.methods.incrementViewCount = function() {
  this.metadata.viewCount += 1;
  this.metadata.lastUpdated = new Date();
  return this.save();
};

// Method to check if user can manage this person
personSchema.methods.canManage = async function(userId) {
  // Allow editors, admins, and super admins to manage all people
  const User = require('./User');
  const user = await User.findById(userId);
  if (user && (user.role === 'editor' || user.role === 'admin' || user.role === 'superadmin')) {
    return true;
  }
  
  return false;
};

// Pre-save middleware to update last updated timestamp
personSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Person', personSchema);

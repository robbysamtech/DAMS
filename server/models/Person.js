const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  profilePhoto: {
    type: String,
    required: true
  },
  ministrySection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MinistrySection',
    required: true
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
    enum: ['Leader', 'Member', 'Coordinator', 'Assistant', 'Volunteer'],
    default: 'Member'
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
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
    maxlength: 1000,
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
  sectionResponsibilities: {
    type: String,
    maxlength: 500,
    trim: true
  },
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
personSchema.index({ ministrySection: 1 });
personSchema.index({ creator: 1 });
personSchema.index({ status: 1 });
personSchema.index({ role: 1 });
personSchema.index({ department: 1 });
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
  return this.jobTitle;
});

// Method to increment view count
personSchema.methods.incrementViewCount = function() {
  this.metadata.viewCount += 1;
  this.metadata.lastUpdated = new Date();
  return this.save();
};

// Method to check if user can manage this person
personSchema.methods.canManage = function(userId) {
  return this.creator.toString() === userId.toString();
};

// Method to get ministry section details
personSchema.methods.getMinistrySection = function() {
  return this.populate('ministrySection');
};

// Pre-save middleware to update last updated timestamp
personSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

// Post-save middleware to update ministry section member count
personSchema.post('save', async function() {
  try {
    const MinistrySection = mongoose.model('MinistrySection');
    await MinistrySection.findByIdAndUpdate(
      this.ministrySection,
      { $inc: { 'metadata.memberCount': 1 } }
    );
  } catch (error) {
    console.error('Error updating ministry section member count:', error);
  }
});

// Post-remove middleware to update ministry section member count
personSchema.post('remove', async function() {
  try {
    const MinistrySection = mongoose.model('MinistrySection');
    await MinistrySection.findByIdAndUpdate(
      this.ministrySection,
      { $inc: { 'metadata.memberCount': -1 } }
    );
  } catch (error) {
    console.error('Error updating ministry section member count:', error);
  }
});

module.exports = mongoose.model('Person', personSchema);

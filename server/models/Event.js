const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  address: {
    streetAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  eventType: {
    type: String,
    enum: ['in-person', 'virtual', 'hybrid'],
    default: 'in-person'
  },
  maxAttendees: {
    type: Number,
    min: 1
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  eventImage: {
    type: String
  },

  metadata: {
    viewCount: {
      type: Number,
      default: 0
    },
    attendeeCount: {
      type: Number,
      default: 0
    },
    registrationCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    endDate: Date,
    daysOfWeek: [{
      type: Number, // 0 = Sunday, 1 = Monday, etc.
      min: 0,
      max: 6
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ creator: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ eventType: 1 });

eventSchema.index({ visibility: 1 });

// Virtual for formatted date and time
eventSchema.virtual('formattedDateTime').get(function() {
  const eventDate = new Date(this.date);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return `${eventDate.toLocaleDateString('en-US', options)} at ${this.time}`;
});

// Virtual for full address
eventSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [];
  if (this.address.streetAddress) parts.push(this.address.streetAddress);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  
  return parts.join(', ');
});

// Virtual for short address (city, state)
eventSchema.virtual('shortAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [];
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  
  return parts.join(', ');
});

// Virtual for is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date(this.date) > new Date();
});

// Virtual for is past
eventSchema.virtual('isPast').get(function() {
  return new Date(this.date) < new Date();
});

// Virtual for is today
eventSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.date);
  return today.toDateString() === eventDate.toDateString();
});

// Method to increment view count
eventSchema.methods.incrementViewCount = function() {
  this.metadata.viewCount += 1;
  this.metadata.lastUpdated = new Date();
  return this.save();
};

// Method to check if user can manage this event
eventSchema.methods.canManage = async function(userId) {
  // Allow editors, admins, and super admins to manage all events
  const User = require('./User');
  const user = await User.findById(userId);
  if (user && (user.role === 'editor' || user.role === 'admin' || user.role === 'superadmin')) {
    return true;
  }
  
  return false;
};

// Method to check if event is published
eventSchema.methods.isPublished = function() {
  return this.status === 'published';
};

// Method to check if registration is open
eventSchema.methods.isRegistrationOpen = function() {
  if (!this.registrationRequired) return false;
  if (this.maxAttendees && this.metadata.registrationCount >= this.maxAttendees) return false;
  return this.isUpcoming;
};

// Pre-save middleware to update last updated timestamp
eventSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
  return this.find({
    status: 'published',
    date: { $gte: new Date() },
    visibility: 'public'
  })
  .sort({ date: 1 })
  .limit(limit)
  .populate('creator', 'firstName lastName')
  .populate('relatedMinistrySection', 'name');
};

// Static method to get events by ministry section
eventSchema.statics.getEventsByMinistrySection = function(sectionId, limit = 20) {
  return this.find({
    relatedMinistrySection: sectionId,
    status: 'published',
    visibility: 'public'
  })
  .sort({ date: 1 })
  .limit(limit)
  .populate('creator', 'firstName lastName');
};

module.exports = mongoose.model('Event', eventSchema);

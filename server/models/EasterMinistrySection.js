const mongoose = require('mongoose');

const easterMinistrySectionSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 10
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  backgroundImage: {
    type: String,
    required: false,
    trim: true
  },
  tileImage: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
easterMinistrySectionSchema.index({ order: 1 });
easterMinistrySectionSchema.index({ isActive: 1 });
easterMinistrySectionSchema.index({ creator: 1 });

// Instance method to check if user can manage this section
easterMinistrySectionSchema.methods.canManage = function(userId) {
  // For now, only the creator can manage their sections
  // This can be expanded to include admin/superadmin permissions
  return this.creator.toString() === userId.toString();
};

module.exports = mongoose.model('EasterMinistrySection', easterMinistrySectionSchema);

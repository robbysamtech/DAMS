const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['image', 'event'],
    required: true,
    default: 'image'
  },
  image: {
    type: String,
    required: true
  },
  // Event-specific fields (only for event type)
  eventDate: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  eventTime: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  // Metadata
  order: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
carouselSchema.index({ order: 1, isActive: 1 });
carouselSchema.index({ status: 1 });

module.exports = mongoose.model('Carousel', carouselSchema);

const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    unique: true
  },
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
  tileImage: {
    type: String,
    required: false
  },
  tileImageFile: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
homeSectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
homeSectionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('HomeSection', homeSectionSchema);

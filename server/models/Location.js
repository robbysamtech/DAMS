const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['San Jose', 'San Ramon']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
locationSchema.index({ name: 1 });
locationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Location', locationSchema);

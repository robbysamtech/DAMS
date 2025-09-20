const mongoose = require('mongoose');

const YouthMinistrySectionSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  backgroundImage: {
    type: String, // URL or path to the image
    trim: true,
  },
  tileImage: {
    type: String, // URL or path to the image
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
});

// Update the `updatedAt` field on save
YouthMinistrySectionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

// Static method to get active sections
YouthMinistrySectionSchema.statics.findActiveSections = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to get all sections for admin
YouthMinistrySectionSchema.statics.findAllSections = function() {
  return this.find({}).sort({ order: 1 });
};

const YouthMinistrySection = mongoose.model('YouthMinistrySection', YouthMinistrySectionSchema);

module.exports = YouthMinistrySection;

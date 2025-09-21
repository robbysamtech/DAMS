const mongoose = require('mongoose');

const ChildrenMinistrySectionSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  backgroundImage: {
    type: String,
    trim: true
  },
  tileImage: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
});

ChildrenMinistrySectionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

ChildrenMinistrySectionSchema.statics.findActiveSections = function() {
  return this.find({}).sort({ order: 1 });
};

ChildrenMinistrySectionSchema.statics.findAllSections = function() {
  return this.find({}).sort({ order: 1 });
};

const ChildrenMinistrySection = mongoose.model('ChildrenMinistrySection', ChildrenMinistrySectionSchema);

module.exports = ChildrenMinistrySection;

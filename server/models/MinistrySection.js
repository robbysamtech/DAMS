const mongoose = require('mongoose');

const ministrySectionSchema = new mongoose.Schema({
  name: {
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
  sectionType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
  visualIdentity: {
    color: {
      type: String,
      default: '#2563eb'
    },
    image: String,
    icon: String
  },
  hierarchy: {
    parentSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MinistrySection'
    },
    order: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 0
    }
  },
  contactPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    memberCount: {
      type: Number,
      default: 0
    },
    eventCount: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ministrySectionSchema.index({ creator: 1 });
ministrySectionSchema.index({ status: 1 });
ministrySectionSchema.index({ 'hierarchy.parentSection': 1 });
ministrySectionSchema.index({ sectionType: 1 });
ministrySectionSchema.index({ tags: 1 });

// Virtual for full hierarchy path
ministrySectionSchema.virtual('hierarchyPath').get(function() {
  if (!this.hierarchy.parentSection) {
    return this.name;
  }
  return `${this.hierarchy.parentSection.hierarchyPath} > ${this.name}`;
});

// Method to get all child sections
ministrySectionSchema.methods.getChildSections = function() {
  return this.model('MinistrySection').find({
    'hierarchy.parentSection': this._id,
    status: 'active'
  }).sort('hierarchy.order');
};

// Method to get all parent sections
ministrySectionSchema.methods.getParentSections = async function() {
  const parents = [];
  let currentSection = this;
  
  while (currentSection.hierarchy.parentSection) {
    const parent = await this.model('MinistrySection').findById(
      currentSection.hierarchy.parentSection
    );
    if (parent) {
      parents.unshift(parent);
      currentSection = parent;
    } else {
      break;
    }
  }
  
  return parents;
};

// Method to update member count
ministrySectionSchema.methods.updateMemberCount = async function() {
  const Person = mongoose.model('Person');
  const count = await Person.countDocuments({
    ministrySection: this._id,
    status: 'active'
  });
  
  this.metadata.memberCount = count;
  return this.save();
};

// Method to check if user can manage this section
ministrySectionSchema.methods.canManage = function(userId) {
  return this.creator.toString() === userId.toString();
};

// Pre-save middleware to update hierarchy level
ministrySectionSchema.pre('save', async function(next) {
  if (this.hierarchy.parentSection) {
    const parent = await this.model('MinistrySection').findById(this.hierarchy.parentSection);
    if (parent) {
      this.hierarchy.level = parent.hierarchy.level + 1;
    }
  } else {
    this.hierarchy.level = 0;
  }
  next();
});

module.exports = mongoose.model('MinistrySection', ministrySectionSchema);

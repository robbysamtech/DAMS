const mongoose = require('mongoose');

const HarvestCommitteeSectionSchema = new mongoose.Schema({
  order: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  backgroundImage: { type: String, trim: true },
  tileImage: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
});

HarvestCommitteeSectionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

HarvestCommitteeSectionSchema.statics.findActiveSections = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

HarvestCommitteeSectionSchema.statics.findAllSections = function() {
  return this.find({}).sort({ order: 1 });
};

const HarvestCommitteeSection = mongoose.model('HarvestCommitteeSection', HarvestCommitteeSectionSchema);
module.exports = HarvestCommitteeSection;
const mongoose = require('mongoose');

const GospelMinistrySectionSchema = new mongoose.Schema({
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

GospelMinistrySectionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

GospelMinistrySectionSchema.statics.findActiveSections = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

GospelMinistrySectionSchema.statics.findAllSections = function() {
  return this.find({}).sort({ order: 1 });
};

const GospelMinistrySection = mongoose.model('GospelMinistrySection', GospelMinistrySectionSchema);
module.exports = GospelMinistrySection;
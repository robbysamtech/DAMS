const mongoose = require('mongoose');

const WomensMinistrySectionSchema = new mongoose.Schema({
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

WomensMinistrySectionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

WomensMinistrySectionSchema.statics.findActiveSections = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

WomensMinistrySectionSchema.statics.findAllSections = function() {
  return this.find({}).sort({ order: 1 });
};

const WomensMinistrySection = mongoose.model('WomensMinistrySection', WomensMinistrySectionSchema);
module.exports = WomensMinistrySection;
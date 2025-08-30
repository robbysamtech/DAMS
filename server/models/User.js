const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    required: true,
    enum: ['pending', 'editor', 'admin'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  profile: {
    phone: String,
    department: String,
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String
    }
  },
  approvalDetails: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    approvalNotes: String,
    rejectionReason: String
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'approvalDetails.approvedBy': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});



// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};



// Method to check if user can create content
userSchema.methods.canCreateContent = function() {
  return this.status === 'active' && (this.role === 'editor' || this.role === 'admin');
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.status === 'active' && this.role === 'admin';
};

// Method to check if user is approved
userSchema.methods.isApproved = function() {
  return this.status === 'active';
};

module.exports = mongoose.model('User', userSchema);

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
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    required: true,
    enum: ['pending', 'editor', 'admin', 'superadmin'],
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
userSchema.index({ userId: 1 });
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
  return this.status === 'active' && (this.role === 'editor' || this.role === 'admin' || this.role === 'superadmin');
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.status === 'active' && (this.role === 'admin' || this.role === 'superadmin');
};

// Method to check if user is super admin
userSchema.methods.isSuperAdmin = function() {
  return this.status === 'active' && this.role === 'superadmin';
};

// Method to check if user is approved
userSchema.methods.isApproved = function() {
  return this.status === 'active';
};

// Static method to generate user ID based on first and last name
userSchema.statics.generateUserIdFromName = function(firstName, lastName) {
  // Clean and format names
  const cleanFirstName = firstName.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
  const cleanLastName = lastName.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  // Take first 3 characters of each name, pad with X if shorter
  const firstPart = cleanFirstName.substring(0, 3).padEnd(3, 'X');
  const lastPart = cleanLastName.substring(0, 3).padEnd(3, 'X');
  
  return `${firstPart}${lastPart}`;
};

// Static method to check if user ID exists
userSchema.statics.userIdExists = async function(userId) {
  const existingUser = await this.findOne({ userId });
  return !!existingUser;
};

module.exports = mongoose.model('User', userSchema);

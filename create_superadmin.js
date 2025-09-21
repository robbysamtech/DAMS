const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dams', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  userId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, required: true, enum: ['pending', 'editor', 'admin', 'superadmin'], default: 'pending' },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending' },
  profile: {
    phone: String,
    department: String,
    bio: { type: String, maxlength: 500 },
    avatar: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String
    }
  },
  approvalDetails: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvalNotes: String,
    rejectionReason: String
  },
  lastLogin: Date
}, {
  timestamps: true
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

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ userId: 'SUPERADMIN' });
    if (existingSuperAdmin) {
      console.log('Superadmin account already exists!');
      console.log('User ID:', existingSuperAdmin.userId);
      console.log('Name:', existingSuperAdmin.firstName, existingSuperAdmin.lastName);
      console.log('Role:', existingSuperAdmin.role);
      console.log('Status:', existingSuperAdmin.status);
      process.exit(0);
    }

    // Create superadmin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      userId: 'SUPERADMIN',
      password: 'password',
      role: 'superadmin',
      status: 'active',
      profile: {
        department: 'Administration'
      },
      approvalDetails: {
        approvedAt: new Date(),
        approvalNotes: 'System created superadmin account'
      }
    });

    await superAdmin.save();
    
    console.log('✅ Superadmin account created successfully!');
    console.log('User ID: SUPERADMIN');
    console.log('Name: Super Admin');
    console.log('Password: password');
    console.log('Role: superadmin');
    console.log('Status: active');
    
  } catch (error) {
    console.error('❌ Error creating superadmin account:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();



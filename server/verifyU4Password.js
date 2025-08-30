const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/dams';

async function verifyU4Password() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the u4 user
    const u4User = await User.findOne({ email: 'u4@u4.com1' });
    
    if (!u4User) {
      console.log('❌ U4 user not found');
      return;
    }
    
    console.log('Found u4 user:', u4User.firstName, u4User.lastName);
    console.log('Current password hash:', u4User.password);
    
    // Test if the password 'password123' matches
    const testPassword = 'password123';
    const isMatch = await bcrypt.compare(testPassword, u4User.password);
    
    console.log(`\nTesting password '${testPassword}':`);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      console.log('\n🔍 Let me try to reset the password again...');
      
      // Hash a new password
      const newPassword = 'password123';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the user's password
      u4User.password = hashedPassword;
      await u4User.save();
      
      console.log('✅ Password reset successfully!');
      console.log('New password hash:', u4User.password);
      
      // Test the new password
      const newIsMatch = await bcrypt.compare(testPassword, u4User.password);
      console.log('New password test:', newIsMatch ? '✅ YES' : '❌ NO');
    }
    
  } catch (error) {
    console.error('Error verifying password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

verifyU4Password();

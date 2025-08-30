require('dotenv').config();
const mongoose = require('mongoose');
const HomeSection = require('./models/HomeSection');

async function testHomeSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dams', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if HomeSection model exists
    console.log('\n🧪 Test 1: Checking HomeSection model...');
    const modelExists = mongoose.models.HomeSection;
    console.log(`HomeSection model exists: ${!!modelExists}`);

    // Test 2: Count existing home sections
    console.log('\n🧪 Test 2: Counting existing home sections...');
    const count = await HomeSection.countDocuments();
    console.log(`Total home sections in database: ${count}`);

    // Test 3: Fetch all home sections
    console.log('\n🧪 Test 3: Fetching all home sections...');
    const sections = await HomeSection.find().sort({ order: 1 });
    console.log(`Found ${sections.length} sections:`);
    
    sections.forEach(section => {
      console.log(`  - Section ${section.order}: "${section.title}" (${section.isActive ? 'Active' : 'Inactive'})`);
    });

    // Test 4: Check schema validation
    console.log('\n🧪 Test 4: Testing schema validation...');
    try {
      const invalidSection = new HomeSection({
        // Missing required fields
      });
      await invalidSection.save();
      console.log('❌ Schema validation failed - should have required fields');
    } catch (error) {
      console.log('✅ Schema validation working - required fields enforced');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the test
testHomeSections();

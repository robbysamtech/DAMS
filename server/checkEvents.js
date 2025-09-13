const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cci', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkEvents() {
  try {
    console.log('Checking events and permissions...');
    
    // Get all events
    const events = await Event.find({}).populate('creator', 'userId firstName lastName role');
    console.log(`Found ${events.length} events:`);
    
    events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`- Title: ${event.title}`);
      console.log(`- Creator ID: ${event.creator?._id}`);
      console.log(`- Creator User ID: ${event.creator?.userId}`);
      console.log(`- Creator Name: ${event.creator?.firstName} ${event.creator?.lastName}`);
      console.log(`- Creator Role: ${event.creator?.role}`);
    });
    
    // Get SAM ROB user
    const samRob = await User.findOne({ userId: 'SAMROB' });
    if (samRob) {
      console.log(`\nSAM ROB user:`);
      console.log(`- ID: ${samRob._id}`);
      console.log(`- User ID: ${samRob.userId}`);
      console.log(`- Role: ${samRob.role}`);
      console.log(`- Status: ${samRob.status}`);
      
      // Test permissions for each event
      if (events.length > 0) {
        console.log(`\nTesting SAM ROB permissions:`);
        for (const event of events) {
          const canManage = await event.canManage(samRob._id);
          console.log(`- Can manage "${event.title}": ${canManage}`);
        }
      }
    } else {
      console.log('SAM ROB user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkEvents();

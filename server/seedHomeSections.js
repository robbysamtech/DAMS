require('dotenv').config();
const mongoose = require('mongoose');
const HomeSection = require('./models/HomeSection');

// Sample home sections data with random images and varied content
const homeSectionsData = [
           {
           order: 1,
           title: "Building Stronger Communities Together ABC",
           description: "Experience the power of unity as we work hand in hand to create lasting bonds and meaningful relationships. Our community thrives on diversity, compassion, and shared values that bring people from all walks of life together in harmony.",
           backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
           tileImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
           isActive: true
         },
  {
    order: 2,
    title: "Nurturing Faith Through Knowledge",
    description: "Discover deeper spiritual insights through our comprehensive learning programs, interactive workshops, and guided study sessions. We believe that knowledge strengthens faith and understanding leads to growth in every aspect of life.",
    backgroundImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 3,
    title: "Serving Others with Compassion",
    description: "Join our mission to make a positive difference in the world through acts of kindness, volunteer service, and community outreach programs. Every helping hand contributes to building a better tomorrow for everyone.",
    backgroundImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 4,
    title: "Celebrating Life's Special Moments",
    description: "Experience the joy of community celebrations, seasonal festivals, and special gatherings that bring people together. From traditional ceremonies to modern events, we create memories that last a lifetime.",
    backgroundImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  }
];

async function seedHomeSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dams', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing home sections
    await HomeSection.deleteMany({});
    console.log('Cleared existing home sections');

    // Ensure we only create exactly 4 sections
    if (homeSectionsData.length !== 4) {
      throw new Error(`Expected exactly 4 sections, but found ${homeSectionsData.length}`);
    }

    // Validate order numbers are 1-4
    const validOrders = homeSectionsData.every(section => section.order >= 1 && section.order <= 4);
    if (!validOrders) {
      throw new Error('All sections must have order numbers between 1 and 4');
    }

    // Check for duplicate order numbers
    const orders = homeSectionsData.map(section => section.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== 4) {
      throw new Error('All sections must have unique order numbers');
    }

    // Insert new home sections
    const insertedSections = await HomeSection.insertMany(homeSectionsData);
    console.log(`Successfully inserted ${insertedSections.length} home sections`);
    
    // Verify we have exactly 4 sections
    const finalCount = await HomeSection.countDocuments();
    if (finalCount !== 4) {
      throw new Error(`Database should contain exactly 4 sections, but found ${finalCount}`);
    }

    // Display the inserted sections
    insertedSections.forEach(section => {
      console.log(`- Section ${section.order}: ${section.title}`);
    });

    console.log('\nHome sections seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding home sections:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedHomeSections();

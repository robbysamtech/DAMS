require('dotenv').config();
const mongoose = require('mongoose');
const HomeSection = require('./models/HomeSection');

// Sample home sections data with contemporary content - images will be uploaded separately
const homeSectionsData = [
  {
    order: 1,
    title: "Building Stronger Communities Together",
    description: "Experience the power of unity as we work hand in hand to create lasting bonds and meaningful relationships. Our community thrives on diversity, compassion, and shared values that bring people from all walks of life together in harmony. Join us in building bridges across cultures, generations, and backgrounds.",
    backgroundImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 2,
    title: "Nurturing Faith Through Knowledge",
    description: "Discover deeper spiritual insights through our comprehensive learning programs, interactive workshops, and guided study sessions. We believe that knowledge strengthens faith and understanding leads to growth in every aspect of life. Explore ancient wisdom with modern perspectives.",
    backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 3,
    title: "Serving Others with Compassion",
    description: "Make a difference in our community through various service initiatives, volunteer opportunities, and outreach programs. Together, we can create positive change and support those in need. Every act of kindness, no matter how small, has the power to transform lives.",
    backgroundImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 4,
    title: "Celebrating Life's Special Moments",
    description: "Experience the joy of community celebrations, seasonal festivals, and special gatherings that bring people together. From traditional ceremonies to modern events, we create memories that last a lifetime. Join us in celebrating the beautiful tapestry of human connection.",
    backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 5,
    title: "Empowering Youth for Tomorrow",
    description: "Investing in the next generation through youth programs, leadership development, and mentorship opportunities. We believe every young person has the potential to make a positive impact on our world. Join us in nurturing the leaders of tomorrow.",
    backgroundImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    isActive: true
  },
  {
    order: 6,
    title: "Creating Lasting Family Bonds",
    description: "Strengthening family relationships through shared experiences, support groups, and family-oriented activities. We understand that strong families are the foundation of a thriving community. Let's build stronger connections together.",
    backgroundImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    tileImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
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

               // Ensure we only create exactly 6 sections
           if (homeSectionsData.length !== 6) {
             throw new Error(`Expected exactly 6 sections, but found ${homeSectionsData.length}`);
           }
       
           // Validate order numbers are 1-6
           const validOrders = homeSectionsData.every(section => section.order >= 1 && section.order <= 6);
           if (!validOrders) {
             throw new Error('All sections must have order numbers between 1 and 6');
           }
       
           // Check for duplicate order numbers
           const orders = homeSectionsData.map(section => section.order);
           const uniqueOrders = new Set(orders);
           if (uniqueOrders.size !== 6) {
             throw new Error('All sections must have unique order numbers');
           }

    // Insert new home sections
    const insertedSections = await HomeSection.insertMany(homeSectionsData);
    console.log(`Successfully inserted ${insertedSections.length} home sections`);
    
               // Verify we have exactly 6 sections
           const finalCount = await HomeSection.countDocuments();
           if (finalCount !== 6) {
             throw new Error(`Database should contain exactly 6 sections, but found ${finalCount}`);
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

const mongoose = require('mongoose');
const Carousel = require('./models/Carousel');
require('dotenv').config();

// Sample carousel data
const carouselItems = [
  {
    title: "Welcome to Christ Church of India",
    description: "Streamline your ministry operations with our comprehensive platform for managing events, people, and digital assets.",
    type: "image",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    order: 1,
    isActive: true,
    status: "active",
    creator: "68ab8e9e4318cd4d2bb6cbf3" // Default admin user ID
  },
  {
    title: "Sunday Service",
    description: "Join us for our weekly Sunday service featuring inspiring worship and meaningful fellowship.",
    type: "event",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    eventDate: "Every Sunday",
    eventTime: "10:00 AM",
    order: 2,
    isActive: true,
    status: "active",
    creator: "68ab8e9e4318cd4d2bb6cbf3" // Default admin user ID
  },
  {
    title: "Our Team",
    description: "Meet our dedicated team of ministry leaders and volunteers who make everything possible.",
    type: "image",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
    order: 3,
    isActive: true,
    status: "active",
    creator: "68ab8e9e4318cd4d2bb6cbf3" // Default admin user ID
  }
];

async function seedCarousel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cci');
    console.log('Connected to MongoDB');

    // Clear existing carousel items
    await Carousel.deleteMany({});
    console.log('Cleared existing carousel items');

    // Insert new carousel items
    const createdItems = await Carousel.insertMany(carouselItems);
    console.log(`Created ${createdItems.length} carousel items:`);
    
    createdItems.forEach(item => {
      console.log(`- ${item.title} (${item.type})`);
    });

    console.log('Carousel seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding carousel:', error);
    process.exit(1);
  }
}

seedCarousel();

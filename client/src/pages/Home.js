import React, { useState, useEffect } from 'react';
import './Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample carousel data
  const carouselItems = [
    {
      id: 1,
      type: 'image',
      title: 'Welcome to DAMS',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
      description: 'Streamline your ministry operations with our comprehensive platform for managing events, people, and digital assets.'
    },
    {
      id: 2,
      type: 'event',
      title: 'Sunday Service',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Join us for our weekly Sunday service featuring inspiring worship and meaningful fellowship.',
      date: 'Every Sunday',
      time: '10:00 AM'
    },
    {
      id: 3,
      type: 'image',
      title: 'Ministry Team',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      description: 'Meet our dedicated team of ministry leaders and volunteers who make everything possible.'
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    console.log('Carousel useEffect triggered, currentSlide:', currentSlide);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const goToSlide = (index) => {
    console.log('Going to slide:', index);
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    console.log('Going to previous slide');
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    console.log('Going to next slide');
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  console.log('Rendering Home component, currentSlide:', currentSlide, 'total slides:', carouselItems.length);

  return (
    <div className="home">
      {/* Hero Carousel Section */}
      <section className="hero-carousel">
        <div className="carousel-container" data-current={currentSlide}>
          {carouselItems.map((item, index) => (
            <div
              key={item.id}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <div className="carousel-image">
                <img src={item.image} alt={item.title} />
                <div className="carousel-overlay">
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation */}
        <button className="carousel-nav carousel-prev" onClick={goToPrevious}>
          <span>‹</span>
        </button>
        <button className="carousel-nav carousel-next" onClick={goToNext}>
          <span>›</span>
        </button>

        {/* Carousel Text Section - Bottom */}
        <div className="carousel-text-section">
          <div className="carousel-text-content">
            <h2 className="carousel-text-title">{carouselItems[currentSlide].title}</h2>
            <p className="carousel-text-description">{carouselItems[currentSlide].description}</p>
            
            {carouselItems[currentSlide].type === 'event' && (
              <div className="carousel-event-details">
                <div className="carousel-event-date">
                  <span className="carousel-event-icon">📅</span>
                  <span>{carouselItems[currentSlide].date}</span>
                </div>
                <div className="carousel-event-time">
                  <span className="carousel-event-icon">🕒</span>
                  <span>{carouselItems[currentSlide].time}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

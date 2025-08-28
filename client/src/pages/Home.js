import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isCreator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch carousel items from MongoDB
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/carousel');
        if (!response.ok) {
          throw new Error('Failed to fetch carousel items');
        }
        const data = await response.json();
        setCarouselItems(data);
        setError(null);
      } catch (err) {
        setError('Failed to load carousel content');
        // Fallback to sample data if API fails
        setCarouselItems([
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
            eventDate: 'Every Sunday',
            eventTime: '10:00 AM'
          },
          {
            id: 3,
            type: 'image',
            title: 'Ministry Team',
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
            description: 'Meet our dedicated team of ministry leaders and volunteers who make everything possible.'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (carouselItems.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [carouselItems.length]);

  // Debug: Log current slide changes
  useEffect(() => {
    console.log('Current slide changed to:', currentSlide, 'Total slides:', carouselItems.length);
  }, [currentSlide, carouselItems.length]);

  // Debug: Log carousel items when loaded
  useEffect(() => {
    if (carouselItems.length > 0) {
      console.log('Carousel items loaded:', carouselItems);
    }
  }, [carouselItems]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  if (loading) {
    return (
      <div className="home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading carousel content...</p>
        </div>
      </div>
    );
  }

  if (error || carouselItems.length === 0) {
    return (
      <div className="home">
        {/* Show Edit Carousel button for content creators even when no content */}
        {!authLoading && isCreator && (
          <section className="hero-carousel empty-carousel">
            <button 
              className="carousel-edit-btn" 
              onClick={() => {
                navigate('/edit-carousel');
              }}
              title="Edit Carousel Content"
            >
              <span className="edit-icon">✏️</span>
              <span className="edit-text">Edit Carousel</span>
            </button>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Carousel Section */}
      <section className="hero-carousel">
        {/* Edit Button - Top Right Corner (Content Creators Only) */}
        {!authLoading && isCreator && (
          <button 
            className="carousel-edit-btn" 
            onClick={() => {
              navigate('/edit-carousel');
            }}
            title="Edit Carousel Content"
          >
            <span className="edit-icon">✏️</span>
            <span className="edit-text">Edit Carousel</span>
          </button>
        )}

        <div 
          className="carousel-container" 
          data-current={currentSlide}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {carouselItems.map((item, index) => (
            <div
              key={item._id || item.id}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <div className="carousel-image">
                <img src={item.image.startsWith('http') ? item.image : `http://localhost:5001${item.image}`} alt={item.title} />
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
                  <span>{carouselItems[currentSlide].eventDate}</span>
                </div>
                <div className="carousel-event-time">
                  <span className="carousel-event-icon">🕒</span>
                  <span>{carouselItems[currentSlide].eventTime}</span>
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

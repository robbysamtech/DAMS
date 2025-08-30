import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isEditor, loading: authLoading } = useAuth();
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
        console.error('Error fetching carousel:', err);
        // No fallback data - only load from database
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

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
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

  return (
    <div className="home">
      {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
      {!authLoading && isEditor && (
        <button 
          className="carousel-edit-btn" 
          onClick={() => {
            navigate('/edit-carousel');
          }}
          title="Edit Carousel Content"
        >
          Edit
        </button>
      )}

      {/* Hero Carousel Section */}
      {carouselItems.length > 0 ? (
        <section className="hero-carousel">
          <div 
            className="carousel-container" 
            data-current={currentSlide}
            style={{ 
              transform: `translateX(-${currentSlide * 100}vw)`,
              width: `${carouselItems.length * 100}vw` // Ensure container is wide enough
            }}
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
                    <span>{formatDate(carouselItems[currentSlide].eventDate)}</span>
                  </div>
                  <div className="carousel-event-time">
                    <span className="carousel-event-icon">🕒</span>
                    <span>{formatTime(carouselItems[currentSlide].eventTime)}</span>
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
      ) : (
        <div className="empty-carousel-message">
          <p>No carousel content available. Click "Edit" to add some!</p>
        </div>
      )}
    </div>
  );
};

export default Home;

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselItems, setCarouselItems] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

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
        // No fallback data - only load from database
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Fetch home sections from MongoDB
  useEffect(() => {
    const fetchHomeSections = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/home-sections');
        if (!response.ok) {
          throw new Error('Failed to fetch home sections');
        }
        const data = await response.json();
        setHomeSections(data);
      } catch (err) {
        // Keep existing sections if fetch fails
      }
    };

    fetchHomeSections();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (carouselItems.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [carouselItems.length]);

  // Simple scroll-based animation
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      
      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const threshold = windowHeight * 1.0; // Balanced threshold for smooth animation
          
          const isVisible = rect.top < threshold;
          
          if (isVisible && !animatedSections.has(index)) {
            setAnimatedSections(prev => new Set([...prev, index]));
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animatedSections]); // Dependency on animatedSections to re-run when state changes

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
          <h2>{t('home.loading.title')}</h2>
          <p>{t('home.loading.subtitle')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="error-container">
          <h2>{t('home.error.title')}</h2>
          <p>{t('home.error.subtitle')}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            {t('home.error.retry_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
      {!authLoading && (isEditor || isAdmin) && (
        <button 
          className="home-page-edit-btn" 
          onClick={() => {
            navigate('/edit-home-page');
          }}
          title="Edit Home Page"
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
          <button 
            className="carousel-nav carousel-prev" 
            onClick={goToPrevious}
            aria-label={t('home.home_page.navigation.previous')}
            title={t('home.home_page.navigation.previous')}
          >
            <span>‹</span>
          </button>
          <button 
            className="carousel-nav carousel-next" 
            onClick={goToNext}
            aria-label={t('home.home_page.navigation.next')}
            title={t('home.home_page.navigation.next')}
          >
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
          <div className="carousel-indicators" role="tablist" aria-label="Carousel slides">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={t('home.home_page.navigation.go_to_slide', { slide: index + 1 })}
                aria-selected={index === currentSlide}
                role="tab"
              />
            ))}
          </div>


        </section>
      ) : (
        <div className="empty-carousel-message">
          <p>{t('home.home_page.empty_message')}</p>
        </div>
      )}

            {/* Content Sections Below Carousel */}
      <section className="content-sections">
        {homeSections.length > 0 ? (
          homeSections.map((section, index) => (
            <div 
              key={section._id}
              ref={(el) => (sectionRefs.current[index] = el)}
              className={`content-section section-${index + 1} ${animatedSections.has(index) ? 'animate' : ''}`}
              style={{ 
                opacity: animatedSections.has(index) ? 1 : 0,
                transform: animatedSections.has(index) ? 'translateY(0)' : 'translateY(100px)',
                transition: 'all 0.8s ease'
              }}
            >
              <div className="section-content">
                {/* Title spans across both image and description */}
                <h2 className="section-title">{section.title}</h2>
                
                {/* Body with 3/4 description and 1/4 image */}
                <div className="section-body">
                  <p className="section-description">{section.description}</p>
                  {section.tileImage && (
                    <div className="section-image">
                      <img 
                        src={section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`}
                        alt={section.title}
                        className="section-photo"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-sections-message">
            <p>Loading home sections...</p>
            <p>Debug: homeSections.length = {homeSections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;

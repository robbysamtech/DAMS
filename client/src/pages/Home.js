import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isEditor, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with first section visible

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

  // Simple scroll-based animation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const threshold = windowHeight * 1.0; // Changed to 1.0 to test timing
          
          const isVisible = rect.top < threshold;
          
          console.log(`Section ${index}: rect.top=${rect.top}, threshold=${threshold}, isVisible=${isVisible}`);

          if (isVisible && !animatedSections.has(index)) {
            console.log('Section visible on scroll:', index);
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
      {!authLoading && isEditor && (
        <button 
          className="home-page-edit-btn" 
          onClick={() => {
            navigate('/edit-home-page');
          }}
          title={t('home.home_page.edit_button')}
        >
          {t('common.edit')}
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

 
        {/* Section 1: Welcome - Text Left, Image Right */}
        <div 
          ref={(el) => (sectionRefs.current[0] = el)}
          className={`content-section section-welcome ${animatedSections.has(0) ? 'animate' : ''}`}
          style={{ 
            opacity: animatedSections.has(0) ? 1 : 0,
            transform: animatedSections.has(0) ? 'translateY(0)' : 'translateY(100px)',
            transition: 'all 0.8s ease'
          }}
        >
          <div className="section-content">
            <div className="section-text">
              <h2 className="section-title">{t('home.sections.welcome.title')}</h2>
              <p className="section-description">{t('home.sections.welcome.description')}</p>
            </div>
            <div className="section-image">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80" 
                alt="Colorful welcome carpet design"
                className="section-photo"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Community - Image Left, Text Right */}
        <div 
          ref={(el) => (sectionRefs.current[1] = el)}
          className={`content-section section-community ${animatedSections.has(1) ? 'animate' : ''}`}
          style={{ 
            opacity: animatedSections.has(1) ? 1 : 0,
            transform: animatedSections.has(1) ? 'translateY(0)' : 'translateY(100px)',
            transition: 'all 0.8s ease'
          }}
        >
          <div className="section-content">
            <div className="section-image">
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80" 
                alt="Vibrant community carpet pattern"
                className="section-photo"
              />
            </div>
            <div className="section-text">
              <h2 className="section-title">{t('home.sections.community.title')}</h2>
              <p className="section-description">{t('home.sections.community.description')}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Events - Text Left, Image Right */}
        <div 
          ref={(el) => (sectionRefs.current[2] = el)}
          className={`content-section section-events ${animatedSections.has(2) ? 'animate' : ''}`}
          style={{ 
            opacity: animatedSections.has(2) ? 1 : 0,
            transform: animatedSections.has(2) ? 'translateY(0)' : 'translateY(100px)',
            transition: 'all 0.8s ease'
          }}
        >
          <div className="section-content">
            <div className="section-text">
              <h2 className="section-title">{t('home.sections.events.title')}</h2>
              <p className="section-description">{t('home.sections.events.description')}</p>
            </div>
            <div className="section-image">
              <img 
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80" 
                alt="Dynamic events carpet design"
                className="section-photo"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Get Involved - Image Left, Text Right */}
        <div 
          ref={(el) => (sectionRefs.current[3] = el)}
          className={`content-section section-involved ${animatedSections.has(3) ? 'animate' : ''}`}
          style={{ 
            opacity: animatedSections.has(3) ? 1 : 0,
            transform: animatedSections.has(3) ? 'translateY(0)' : 'translateY(100px)',
            transition: 'all 0.8s ease'
          }}
        >
          <div className="section-content">
            <div className="section-image">
              <img 
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80" 
                alt="Inspiring ministry carpet pattern"
                className="section-photo"
              />
            </div>
            <div className="section-text">
              <h2 className="section-title">{t('home.sections.involved.title')}</h2>
              <p className="section-description">{t('home.sections.involved.description')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

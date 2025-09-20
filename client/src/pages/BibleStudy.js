import React, { useState, useEffect, useRef } from 'react';
import './BibleStudy.css';

const BibleStudy = () => {
  const [biblestudySections, setBibleStudySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Fetch Bible Study sections from MongoDB
  useEffect(() => {
    const fetchBibleStudySections = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/bible-study');
        if (!response.ok) {
          throw new Error('Failed to fetch Bible Study sections');
        }
        const data = await response.json();
        setBibleStudySections(data);
        setError(null);
      } catch (err) {
        setError('Failed to load Bible Study content');
        console.error('Error fetching Bible Study sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBibleStudySections();
  }, []);

  // Simple scroll-based animation (same as Home page)
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const currentRefs = sectionRefs.current;
      
      currentRefs.forEach((ref, index) => {
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

  if (loading) {
    return (
      <div className="biblestudy-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Bible Study...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="biblestudy-page">
        <div className="error-container">
          <h2>Error Loading Bible Study</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="biblestudy-page">
      {/* Content Sections (same structure as Home page) */}
      <section className="content-sections">
        {biblestudySections.length > 0 ? (
          biblestudySections.map((section, index) => (
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
                {/* Alternate text and image positions (same as Home page) */}
                {index % 2 === 0 ? (
                  // Even sections: Text Left, Image Right
                  <>
                    <div className="section-text">
                      <h2 className="section-title">{section.title}</h2>
                      <p className="section-description">{section.description}</p>
                    </div>
                    <div className="section-image">
                      <img 
                        src={section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`}
                        alt={section.title}
                        className="section-photo"
                      />
                    </div>
                  </>
                ) : (
                  // Odd sections: Image Left, Text Right
                  <>
                    <div className="section-image">
                      <img 
                        src={section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`}
                        alt={section.title}
                        className="section-photo"
                      />
                    </div>
                    <div className="section-text">
                      <h2 className="section-title">{section.title}</h2>
                      <p className="section-description">{section.description}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-sections-message">
            <p>Loading Bible Study sections...</p>
            <p>Debug: biblestudySections.length = {biblestudySections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BibleStudy;
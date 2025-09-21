import React, { useState, useEffect, useRef } from 'react';
import './EasterCommittee.css';

const EasterCommittee = () => {
  const [eastercommitteeSections, setEasterCommitteeSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Easter Committee sections from MongoDB
  useEffect(() => {
    const fetchEasterCommitteeSections = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/easter-committee');
        if (!response.ok) {
          throw new Error('Failed to fetch Easter Committee sections');
        }
        const data = await response.json();
        setEasterCommitteeSections(data);
        setError(null);
      } catch (err) {
        setError('Failed to load Easter Committee content');
        console.error('Error fetching Easter Committee sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEasterCommitteeSections();
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
      <div className="eastercommittee-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Easter Committee...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eastercommittee-page">
        <div className="error-container">
          <h2>Error Loading Easter Committee</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="eastercommittee-page">
      {/* Content Sections (same structure as Home page) */}
      <section className="content-sections">
        {eastercommitteeSections.length > 0 ? (
          eastercommitteeSections.map((section, index) => (
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
                         <div className="section-image">
                           <img 
                             src={section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`}
                             alt={section.title}
                             className="section-photo"
                           />
                         </div>
                       </div>
                     </div>
            </div>
          ))
        ) : (
          <div className="no-sections-message">
            <p>Loading Easter Committee sections...</p>
            <p>Debug: eastercommitteeSections.length = {eastercommitteeSections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default EasterCommittee;
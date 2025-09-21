import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EasterMinistry.css';

const EasterMinistry = () => {
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [easterSections, setEasterSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Easter Ministry sections from MongoDB
  const fetchEasterSections = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/easter-ministry');
      if (!response.ok) {
        throw new Error('Failed to fetch Easter Ministry sections');
      }
      const data = await response.json();
      setEasterSections(data);
      setError(null);
    } catch (err) {
      setError('Failed to load Easter Ministry content');
      console.error('Error fetching Easter Ministry sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEasterSections();
  }, []);

  // Refresh data when page becomes visible (returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEasterSections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      <div className="easter-ministry-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Easter Ministry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="easter-ministry-page">
        <div className="error-container">
          <h2>Error Loading Easter Ministry</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="easter-ministry-page">
      {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
      {!authLoading && (isEditor || isAdmin) && (
        <button 
          className="easter-ministry-edit-btn" 
          onClick={() => {
            navigate('/edit-easter-ministry');
          }}
          title="Edit Easter Ministry"
        >
          Edit
        </button>
      )}

      {/* Content Sections (same structure as Home page) */}
      <section className="content-sections">
        {easterSections.length > 0 ? (
          easterSections.map((section, index) => (
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
            <p>Loading Easter Ministry sections...</p>
            <p>Debug: easterSections.length = {easterSections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default EasterMinistry;

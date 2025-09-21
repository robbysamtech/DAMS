import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './GospelMinistry.css';

const GospelMinistry = () => {
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [gospelministrySections, setGospelMinistrySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Gospel Ministry sections from MongoDB
  useEffect(() => {
    const fetchGospelMinistrySections = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/gospel-ministry');
        if (!response.ok) {
          throw new Error('Failed to fetch Gospel Ministry sections');
        }
        const data = await response.json();
        setGospelMinistrySections(data);
        setError(null);
      } catch (err) {
        setError('Failed to load Gospel Ministry content');
        console.error('Error fetching Gospel Ministry sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGospelMinistrySections();
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
      <div className="gospel-ministry-page">
                        {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
            {!authLoading && (isEditor || isAdmin) && (
              <button 
                className="gospel-ministry-edit-btn" 
                onClick={() => {
                  navigate('/edit-gospel-ministry');
                }}
                title="Edit Gospel Ministry"
              >
                Edit
              </button>
            )}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Gospel Ministry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gospelministry-page">
        <div className="error-container">
          <h2>Error Loading Gospel Ministry</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gospelministry-page">
      {/* Content Sections (same structure as Home page) */}
      <section className="content-sections">
        {gospelministrySections.length > 0 ? (
          gospelministrySections.map((section, index) => (
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
            <p>Loading Gospel Ministry sections...</p>
            <p>Debug: gospelministrySections.length = {gospelministrySections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default GospelMinistry;
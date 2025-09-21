import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MensMinistry.css';

const MensMinistry = () => {
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mensministrySections, setMensMinistrySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Men's Ministry sections from MongoDB
  useEffect(() => {
    const fetchMensMinistrySections = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/mens-ministry');
        if (!response.ok) {
          throw new Error('Failed to fetch Men\'s Ministry sections');
        }
        const data = await response.json();
        setMensMinistrySections(data);
        setError(null);
      } catch (err) {
        setError('Failed to load Men\'s Ministry content');
        console.error('Error fetching Men\'s Ministry sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMensMinistrySections();
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
      <div className="mens-ministry-page">
                        {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
            {!authLoading && (isEditor || isAdmin) && (
              <button 
                className="mens-ministry-edit-btn" 
                onClick={() => {
                  navigate('/edit-mens-ministry');
                }}
                title="Edit Mens Ministry"
              >
                Edit
              </button>
            )}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Men's Ministry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mensministry-page">
        <div className="error-container">
          <h2>Error Loading Men's Ministry</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mensministry-page">
      {/* Content Sections (same structure as Home page) */}
      <section className="content-sections">
        {mensministrySections.length > 0 ? (
          mensministrySections.map((section, index) => (
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
            <p>Loading Men's Ministry sections...</p>
            <p>Debug: mensministrySections.length = {mensministrySections.length}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MensMinistry;
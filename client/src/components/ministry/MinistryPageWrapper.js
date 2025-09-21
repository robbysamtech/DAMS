import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MinistrySectionDisplay from './MinistrySectionDisplay';
import './MinistryPageWrapper.css';

const MinistryPageWrapper = ({ 
  ministryName, 
  apiEndpoint, 
  editRoute, 
  pageTitle,
  children 
}) => {
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for section animations
  const sectionRefs = useRef([]);
  const [animatedSections, setAnimatedSections] = useState(new Set([0])); // Start with only first section visible

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch ministry sections from MongoDB
  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${pageTitle} sections`);
      }
      const data = await response.json();
      setSections(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load ${pageTitle} content`);
      console.error(`Error fetching ${pageTitle} sections:`, err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, pageTitle]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Refresh data when page becomes visible (returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchSections]);

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
      <div className={`${ministryName.toLowerCase()}-ministry-page`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading {pageTitle}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${ministryName.toLowerCase()}-ministry-page`}>
        <div className="error-container">
          <h2>Error Loading {pageTitle}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ministryName.toLowerCase()}-ministry-page`}>
      {/* Edit Button - Top Right Corner (Editors Only) - Always Visible */}
      {!authLoading && (isEditor || isAdmin) && (
        <button 
          className={`${ministryName.toLowerCase()}-ministry-edit-btn`}
          onClick={() => {
            navigate(editRoute);
          }}
          title={`Edit ${pageTitle}`}
        >
          Edit
        </button>
      )}

      {/* Content Sections */}
      <section className="content-sections">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <MinistrySectionDisplay
              key={section._id}
              section={section}
              index={index}
              animatedSections={animatedSections}
              sectionRefs={sectionRefs}
              ministryName={ministryName}
            />
          ))
        ) : (
          <div className="no-sections-message">
            <p>Loading {pageTitle} sections...</p>
            <p>Debug: sections.length = {sections.length}</p>
          </div>
        )}
      </section>

      {/* Render any additional children */}
      {children}
    </div>
  );
};

export default MinistryPageWrapper;

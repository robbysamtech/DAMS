import React from 'react';
import './MinistrySectionDisplay.css';

const MinistrySectionDisplay = ({ 
  section, 
  index, 
  animatedSections, 
  sectionRefs, 
  ministryName 
}) => {
  const isAnimated = animatedSections.has(index);
  
  return (
    <div 
      ref={(el) => (sectionRefs.current[index] = el)}
      className={`content-section section-${index + 1} ${isAnimated ? 'animate' : ''}`}
      style={{ 
        opacity: isAnimated ? 1 : 0,
        transform: isAnimated ? 'translateY(0)' : 'translateY(100px)',
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
  );
};

export default MinistrySectionDisplay;

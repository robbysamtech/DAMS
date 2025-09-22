import React from 'react';
import './AdminSection.css';

const AdminSection = ({ 
  title, 
  count, 
  description, 
  isEmpty, 
  emptyMessage, 
  children 
}) => {
  return (
    <div className={`admin-section ${title.toLowerCase().replace(/\s+/g, '-')}-section ${isEmpty ? 'empty-state' : 'populated-state'}`}>
      <h2>{title} ({count})</h2>
      {description && (
        <p className="section-description">
          {description}
        </p>
      )}
      {isEmpty ? (
        <div className="no-items">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="items-container">
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminSection;

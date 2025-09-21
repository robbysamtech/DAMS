import React from 'react';
import './MinistrySectionEdit.css';

const MinistrySectionEdit = ({ 
  section, 
  index, 
  isEditing, 
  formData, 
  onEdit, 
  onCancel, 
  onSave, 
  onInputChange, 
  onFileChange,
  ministryName 
}) => {
  return (
    <div className="section-tile">
      <div className="section-content-wrapper">
        {/* Left Section - Content */}
        <div className="section-left">
          <div className="section-header">
            <h3>Section {index + 1}: {section.title}</h3>
          </div>

          {isEditing ? (
            <div className="section-form">
              <div className="form-group">
                <label>Order:</label>
                <input
                  type="number"
                  value={formData.order || ''}
                  onChange={(e) => onInputChange(section._id, 'order', parseInt(e.target.value))}
                />
              </div>
              
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => onInputChange(section._id, 'title', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => onInputChange(section._id, 'description', e.target.value)}
                  rows="4"
                />
              </div>
            </div>
          ) : (
            <div className="section-preview">
              <p><strong>Order:</strong> {section.order}</p>
              <p><strong>Title:</strong> {section.title}</p>
              <p><strong>Description:</strong> {section.description}</p>
            </div>
          )}
        </div>

        {/* Right Section - Image and Actions */}
        <div className="section-right">
          <div className="section-actions">
            {isEditing ? (
              <>
                <button onClick={() => onSave(section._id)} className="btn-save">Save</button>
                <button onClick={() => onCancel(section._id)} className="btn-cancel">Cancel</button>
              </>
            ) : (
              <button onClick={() => onEdit(section._id)} className="btn-edit">Edit</button>
            )}
          </div>
          
          <div className="form-group">
            <div className="image-upload-section">
              {(section.tileImagePreview || section.tileImage) && (
                <div className="image-preview">
                  <img 
                    src={section.tileImagePreview || (section.tileImage && section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`)}
                    alt="Tile preview"
                  />
                </div>
              )}
              
              {/* Only show upload controls when editing or when no image exists */}
              {(isEditing || !section.tileImage) && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileChange(section._id, e.target.files[0])}
                    id={`tile-upload-${section._id}`}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`tile-upload-${section._id}`} className="upload-button">
                    {section.tempTileFile ? 'Tile Selected ✓' : (section.tileImage ? (isEditing ? 'Change Tile' : 'Upload Tile') : 'Upload Tile')}
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinistrySectionEdit;

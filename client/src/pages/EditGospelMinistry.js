import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditGospelMinistry.css';

const EditGospelMinistry = () => {
  const { user, isEditor, isAdmin, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [gospelMinistrySections, setEasterSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  // Fetch existing Gospel Ministry sections
  useEffect(() => {
    const fetchEasterSections = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5001/api/gospel-ministry/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch Gospel Ministry sections: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setEasterSections(data);
        setError(null);
      } catch (err) {
        setError(`Failed to load Gospel Ministry content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEasterSections();
    }
  }, [token, isEditor, isAdmin]);

  // Show alert and hide after 3 seconds
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Update section
  const updateSection = async (sectionId, updatedData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('order', updatedData.order);
      formData.append('title', updatedData.title);
      formData.append('description', updatedData.description);
      formData.append('isActive', updatedData.isActive);

      // Add images if they exist
      if (updatedData.tileImage && updatedData.tileImage instanceof File) {
        formData.append('tileImage', updatedData.tileImage);
      }

      const response = await fetch(`http://localhost:5001/api/gospel-ministry/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update section');
      }

      const result = await response.json();
      setEasterSections(prev => 
        prev.map(section => 
          section._id === sectionId ? result.section : section
        )
      );
      showAlert('Section updated successfully!');
      
      // Return the updated section so the SectionEditor can update its form data
      return result.section;
    } catch (err) {
      showAlert(`Error updating section: ${err.message}`, 'error');
      return null;
    }
  };

  // Delete section
  const deleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/gospel-ministry/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete section');
      }

      setEasterSections(prev => prev.filter(section => section._id !== sectionId));
      showAlert('Section deleted successfully!');
    } catch (err) {
      showAlert(`Error deleting section: ${err.message}`, 'error');
    }
  };

  // Add new section
  const addNewSection = async () => {
    try {
      const newOrder = Math.max(...gospelMinistrySections.map(s => s.order), 0) + 1;
      
      const formData = new FormData();
      formData.append('order', newOrder);
      formData.append('title', 'New Section');
      formData.append('description', 'Enter description here...');
      formData.append('isActive', 'true');

      const response = await fetch('http://localhost:5001/api/gospel-ministry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      const newSection = await response.json();
      setEasterSections(prev => [...prev, newSection]);
      showAlert('New section created successfully!');
    } catch (err) {
      showAlert(`Error creating section: ${err.message}`, 'error');
    }
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="edit-gospel-ministry-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isEditor && !isAdmin) {
    return (
      <div className="edit-gospel-ministry-page">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You don't have permission to edit Gospel Ministry content.</p>
          <button onClick={() => navigate('/gospel-ministry')} className="btn-retry">
            Back to Gospel Ministry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="edit-gospel-ministry-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Gospel Ministry sections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-gospel-ministry-page">
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
    <div className="edit-gospel-ministry-page">
      {/* Alert */}
      {alert.show && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="edit-header">
        <h1>Edit Gospel Ministry</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/gospel-ministry')} className="btn-secondary">
            Back to Gospel Ministry
          </button>
          <button onClick={addNewSection} className="btn-primary">
            Add New Section
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="sections-container">
        {gospelMinistrySections.length > 0 ? (
          gospelMinistrySections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <SectionEditor
                key={section._id}
                section={section}
                index={index}
                onUpdate={updateSection}
                onDelete={deleteSection}
              />
            ))
        ) : (
          <div className="no-sections">
            <p>No sections found. Create your first section!</p>
            <button onClick={addNewSection} className="btn-primary">
              Add First Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({ section, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    order: section.order,
    title: section.title,
    description: section.description,
    isActive: section.isActive,
    tileImage: null
  });

  // Initialize form data when component mounts
  useEffect(() => {
    setFormData({
      order: section.order,
      title: section.title,
      description: section.description,
      isActive: section.isActive,
      tileImage: null
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount


  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'file' ? files[0] : value)
    }));
  };

  const handleSave = async () => {
    try {
      const result = await onUpdate(section._id, formData);
      
      // Manually update form data with the returned section data
      if (result) {
        setFormData({
          order: result.order,
          title: result.title,
          description: result.description,
          isActive: result.isActive,
          tileImage: null
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      order: section.order,
      title: section.title,
      description: section.description,
      isActive: section.isActive,
      tileImage: null
    });
    setIsEditing(false);
  };

  return (
    <div className="section-editor">
      <div className="section-header">
        <h3>Section {index + 1}: {section.title}</h3>
        <div className="section-actions">
          {isEditing ? (
            <>
              <button key="save" onClick={handleSave} className="btn-save">Save</button>
              <button key="cancel" onClick={handleCancel} className="btn-cancel">Cancel</button>
            </>
          ) : (
            <>
              <button key="edit" onClick={() => setIsEditing(true)} className="btn-edit">Edit</button>
              <button key="delete" onClick={() => onDelete(section._id)} className="btn-delete">Delete</button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="section-form">
          <div className="form-group">
            <label>Order:</label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label>Tile Image:</label>
            <input
              type="file"
              name="tileImage"
              accept="image/*"
              onChange={handleInputChange}
            />
            {(section.tileImage || formData.tileImage) && (
              <div className="current-image">
                <p>Image preview:</p>
                <img 
                  src={formData.tileImage ? URL.createObjectURL(formData.tileImage) : (section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`)}
                  alt="Tile preview"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>
        </div>
      ) : (
        <div className="section-preview">
          <p><strong>Order:</strong> {section.order}</p>
          <p><strong>Title:</strong> {section.title}</p>
          <p><strong>Description:</strong> {section.description}</p>
          <p><strong>Active:</strong> {section.isActive ? 'Yes' : 'No'}</p>
          {section.tileImage && (
            <div className="preview-image">
              <p><strong>Tile Image:</strong></p>
              <img 
                src={section.tileImage.startsWith('http') ? section.tileImage : `http://localhost:5001${section.tileImage}`}
                alt="Tile preview"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditGospelMinistry;

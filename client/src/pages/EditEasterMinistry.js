import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditEasterMinistry.css';

const EditEasterMinistry = () => {
  const { isEditor, isAdmin, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [easterSections, setEasterSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  // Add editing state for each section
  const [editingSections, setEditingSections] = useState({});
  const [sectionFormData, setSectionFormData] = useState({});

  // Initialize form data for a section
  const initializeSectionFormData = (section) => {
    return {
      order: section.order,
      title: section.title,
      description: section.description,
      isActive: true,
      tileImage: null
    };
  };

  // Fetch existing Easter Ministry sections
  useEffect(() => {
    const fetchEasterSections = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5001/api/easter-ministry/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sections');
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setEasterSections(data.filter(section => section && section._id && section.title));
        } else {
          setEasterSections([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching Easter Ministry sections:', err);
        setError(err.message);
        setEasterSections([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEasterSections();
    }
  }, [token]);

  // Show alert and hide after 3 seconds
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle edit button click
  const handleEditSection = (sectionId) => {
    const section = easterSections.find(s => s._id === sectionId);
    if (section) {
      setEditingSections(prev => ({ ...prev, [sectionId]: true }));
      setSectionFormData(prev => ({
        ...prev,
        [sectionId]: initializeSectionFormData(section)
      }));
    }
  };

  // Handle cancel button click
  const handleCancelEdit = (sectionId) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: false }));
    setSectionFormData(prev => {
      const newData = { ...prev };
      delete newData[sectionId];
      return newData;
    });
  };

  // Handle input change
  const handleSectionInputChange = (sectionId, field, value) => {
    setSectionFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };

  // Handle file change
  const handleSectionFileChange = (sectionId, file) => {
    setEasterSections(prev =>
      prev.map(section =>
        section._id === sectionId
          ? { ...section, tempTileFile: file, tileImagePreview: file ? URL.createObjectURL(file) : null }
          : section
      )
    );
  };

  // Handle save button click
  const handleSaveSection = async (sectionId) => {
    const formData = sectionFormData[sectionId];
    if (!formData) return;

    console.log('Saving section:', sectionId, formData);
    
    try {
      // First update the text fields
      const response = await fetch(`http://localhost:5001/api/easter-ministry/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: formData.order,
          title: formData.title,
          description: formData.description,
          isActive: true
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const updatedSection = await response.json();

        // Find the section index for image upload
        const sectionIndex = easterSections.findIndex(s => s._id === sectionId);
        const section = easterSections[sectionIndex];

        console.log('Section found:', section);
        console.log('Has tempTileFile:', !!section?.tempTileFile);

        // Upload tile image if a new one was selected
        if (section?.tempTileFile) {
          console.log('Uploading tile image:', section.tileImage);
          const imageFormData = new FormData();
          imageFormData.append('tileImage', section.tempTileFile);

          const tileResponse = await fetch(`http://localhost:5001/api/easter-ministry/${sectionId}/tile-image`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: imageFormData
          });

          console.log('Tile image response status:', tileResponse.status);

          if (tileResponse.ok) {
            const updatedSectionWithImage = await tileResponse.json();
            setEasterSections(prev =>
              prev.map(s =>
                s._id === sectionId ? {
                  ...updatedSectionWithImage,
                  tempTileFile: null,
                  tileImagePreview: null
                } : s
              )
            );
          } else {
            const errorText = await tileResponse.text();
            console.error('Error uploading tile image:', errorText);
          }
        } else {
          console.log('No tile image to upload');
          // No image to upload, just update with text changes
          setEasterSections(prev =>
            prev.map(s =>
              s._id === sectionId ? updatedSection : s
            )
          );
        }

        setEditingSections(prev => ({ ...prev, [sectionId]: false }));
        setSectionFormData(prev => {
          const newData = { ...prev };
          delete newData[sectionId];
          return newData;
        });

        showAlert('Section updated successfully!', 'success');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        showAlert(`Failed to update section: ${errorText}`, 'error');
      }
    } catch (err) {
      console.error('Error updating section:', err);
      showAlert('Error updating section', 'error');
    }
  };

  // Delete section
  const deleteSection = async (sectionId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/easter-ministry/${sectionId}`, {
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
      const response = await fetch('http://localhost:5001/api/easter-ministry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: easterSections.length + 1,
          title: 'New Section',
          description: 'Enter description here',
          isActive: true
        })
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
    return <div className="loading">Loading...</div>;
  }

  if (!isEditor && !isAdmin) {
    return (
      <div className="error">
        <h2>Access Denied</h2>
        <p>You don't have permission to edit Easter Ministry sections.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading sections...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="edit-easter-ministry-page">
      {/* Alert */}
      {alert.show && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="edit-header">
        <h1>Edit Easter Ministry</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/easter-ministry')} className="btn-secondary">
            Back to Easter Ministry
          </button>
          <button onClick={addNewSection} className="btn-primary">
            Add New Section
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="sections-container">
        {easterSections.length > 0 ? (
          easterSections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const isEditing = editingSections[section._id];
              const formData = sectionFormData[section._id] || {};
              
              return (
                <div key={section._id} className="section-tile">
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
                              onChange={(e) => handleSectionInputChange(section._id, 'order', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Title:</label>
                            <input
                              type="text"
                              value={formData.title || ''}
                              onChange={(e) => handleSectionInputChange(section._id, 'title', e.target.value)}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Description:</label>
                            <textarea
                              value={formData.description || ''}
                              onChange={(e) => handleSectionInputChange(section._id, 'description', e.target.value)}
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

                    {/* Right Section - Image */}
                    <div className="section-right">
                      <div className="section-actions">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveSection(section._id)} className="btn-save">Save</button>
                            <button onClick={() => handleCancelEdit(section._id)} className="btn-cancel">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => handleEditSection(section._id)} className="btn-edit">Edit</button>
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
                                onChange={(e) => handleSectionFileChange(section._id, e.target.files[0])}
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
            })
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

export default EditEasterMinistry;
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditHomePage.css';

const EditHomePage = () => {
  const { isEditor, isAdmin, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [carouselItems, setCarouselItems] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
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
      tileImage: null
    };
  };
  
  // Handle edit button click
  const handleEditSection = (sectionId) => {
    const section = homeSections.find(s => s._id === sectionId);
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
  
  // Handle form input changes
  const handleSectionInputChange = (sectionId, field, value) => {
    setSectionFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };
  
  // Handle save button click
  const handleSaveSection = async (sectionId) => {
    const formData = sectionFormData[sectionId];
    if (!formData) return;
    
    console.log('Saving section:', sectionId, formData);
    
    try {
      // First update the text fields
      const response = await fetch(`http://localhost:5001/api/home-sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: formData.order,
          title: formData.title,
          description: formData.description
        })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const updatedSection = await response.json();
        
        // Find the section index for image upload
        const sectionIndex = homeSections.findIndex(s => s._id === sectionId);
        const section = homeSections[sectionIndex];
        
        console.log('Section found:', section);
        console.log('Has tempTileFile:', !!section?.tempTileFile);
        
        // Upload tile image if a new one was selected
        if (section?.tempTileFile) {
          console.log('Uploading tile image:', section.tempTileFile);
          const imageFormData = new FormData();
          imageFormData.append('tileImage', section.tempTileFile);
          
          const tileResponse = await fetch(`http://localhost:5001/api/home-sections/${sectionId}/tile-image`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: imageFormData
          });
          
          console.log('Tile image response status:', tileResponse.status);
          
          if (tileResponse.ok) {
            const updatedSectionWithImage = await tileResponse.json();
            setHomeSections(prev => 
              prev.map(section => 
                section._id === sectionId ? {
                  ...updatedSectionWithImage,
                  tempTileFile: null,
                  tileImagePreview: null
                } : section
              )
            );
          } else {
            const errorText = await tileResponse.text();
            console.error('Error uploading tile image:', errorText);
          }
        } else {
          console.log('No tile image to upload');
          // No image to upload, just update with text changes
          setHomeSections(prev => 
            prev.map(section => 
              section._id === sectionId ? updatedSection : section
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

  // Fetch existing carousel items
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5001/api/carousel/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch carousel items: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setCarouselItems(data);
        setError(null);
      } catch (err) {
        setError(`Failed to load carousel content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Fetch home sections
    const fetchHomeSections = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/home-sections/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHomeSections(data);
        } else {
        }
      } catch (err) {
      }
    };

    if (token) {
      fetchCarouselItems();
      fetchHomeSections();
    } else {
      setLoading(false);
      setError('No authentication token available');
    }
  }, [token]);

  // Initialize 8 tiles (2x4 grid)
  const initializeTiles = useCallback(() => {
    const tiles = [];
    for (let i = 0; i < 8; i++) {
      const existingItem = carouselItems.find(item => item.order === i + 1);
      tiles.push({
        id: existingItem?._id || `tile-${i + 1}`,
        order: i + 1,
        title: existingItem?.title || '',
        description: existingItem?.description || '',
        type: existingItem?.type || 'image',
        image: existingItem?.image || '',
        eventDate: existingItem?.eventDate || '',
        eventTime: existingItem?.eventTime || '',
        isActive: existingItem?.isActive || false,
        exists: !!existingItem
      });
    }
    return tiles;
  }, [carouselItems]);

  const [tiles, setTiles] = useState(initializeTiles());

  // Update tiles when carouselItems change
  useEffect(() => {
    if (carouselItems.length > 0) {
      setTiles(initializeTiles());
    }
  }, [carouselItems, initializeTiles]);

  const handleTypeChange = (tileIndex, newType) => {
    const updatedTiles = [...tiles];
    updatedTiles[tileIndex].type = newType;
    
    // Clear event-specific fields if switching to image type
    if (newType === 'image') {
      updatedTiles[tileIndex].eventDate = '';
      updatedTiles[tileIndex].eventTime = '';
    }
    
    setTiles(updatedTiles);
  };

  const handleInputChange = (tileIndex, field, value) => {
    const updatedTiles = [...tiles];
    updatedTiles[tileIndex][field] = value;
    setTiles(updatedTiles);
  };


  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const hideAlert = () => {
    setAlert({ show: false, message: '', type: 'success' });
  };

  const handleSectionUpdate = async (sectionId, sectionData) => {
    try {
      
      // Find the section in state to check for temporary files
      const sectionIndex = homeSections.findIndex(s => s._id === sectionId);
      const section = homeSections[sectionIndex];
      
      
      
      // Upload tile image if a new one was selected
      if (section?.tempTileFile) {
        const formData = new FormData();
        formData.append('tileImage', section.tempTileFile);
        
        const tileResponse = await fetch(`http://localhost:5001/api/home-sections/${sectionId}/tile-image`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (tileResponse.ok) {
          const tileResult = await tileResponse.json();
          sectionData.tileImage = tileResult.tileImage;
        } else {
          const errorText = await tileResponse.text();
          showAlert('Failed to upload tile image', 'error');
          return;
        }
      }
      
      
      // Now update the section with all data including new image URLs
      const response = await fetch(`http://localhost:5001/api/home-sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionData)
      });

      if (response.ok) {
        const updatedSection = await response.json();
        
        setHomeSections(prev => 
          prev.map(section => 
            section._id === updatedSection._id ? updatedSection : section
          )
        );
        
        // Clear temporary files and previews
        const updatedSections = [...homeSections];
        if (updatedSections[sectionIndex]) {
          updatedSections[sectionIndex].tempTileFile = null;
          updatedSections[sectionIndex].tileImagePreview = null;
          setHomeSections(updatedSections);
        }
        
        showAlert('Section updated successfully!', 'success');
        
        // Refresh the home sections data to ensure UI shows latest images
        await refreshHomeSections();
      } else {
        const errorText = await response.text();
        showAlert('Failed to update section', 'error');
      }
    } catch (err) {
      showAlert(`Error updating section: ${err.message}`, 'error');
    }
  };

  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const handleImageUpload = async (tileIndex, file) => {
    if (!file) return;


    // Store the file temporarily in the tile
    const updatedTiles = [...tiles];
    updatedTiles[tileIndex].tempFile = file;
    updatedTiles[tileIndex].image = ''; // Clear any existing image
    setTiles(updatedTiles);

    // Show preview of selected file
    const reader = new FileReader();
    reader.onload = (e) => {
      const updatedTilesWithPreview = [...tiles];
      updatedTilesWithPreview[tileIndex].imagePreview = e.target.result;
      setTiles(updatedTilesWithPreview);
    };
    reader.readAsDataURL(file);

    showAlert('Image selected! Click Save to upload and save the tile.');
  };

  const handleSaveTile = async (tileIndex) => {
    const tile = tiles[tileIndex];
    
    if (!tile.title || !tile.description) {
      showAlert('Please fill in title and description', 'error');
      return;
    }

    // Check if we have an image (either existing or new file)
    if (!tile.image && !tile.tempFile) {
      showAlert('Please select an image for this tile', 'error');
      return;
    }

    try {
      let response;
      
      if (tile.exists && !tile.tempFile) {
        // Update existing item without changing image
        const tileData = {
          title: tile.title,
          description: tile.description,
          type: tile.type,
          order: tile.order,
          isActive: tile.isActive
        };

        if (tile.type === 'event') {
          if (!tile.eventDate || !tile.eventTime) {
            showAlert('Please fill in event date and time for event type cards', 'error');
            return;
          }
          tileData.eventDate = tile.eventDate;
          tileData.eventTime = tile.eventTime;
        }

        response = await fetch(`http://localhost:5001/api/carousel/${tile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(tileData)
        });
      } else {
        // Create new item or update with new image
        const formData = new FormData();
        formData.append('title', tile.title);
        formData.append('description', tile.description);
        formData.append('type', tile.type);
        formData.append('order', tile.order);
        formData.append('isActive', tile.isActive ? 'true' : 'false');
        
        if (tile.tempFile) {
          formData.append('image', tile.tempFile);
        }

        if (tile.type === 'event') {
          if (!tile.eventDate || !tile.eventTime) {
            showAlert('Please fill in event date and time for event type cards', 'error');
            return;
          }
          formData.append('eventDate', tile.eventDate);
          formData.append('eventTime', tile.eventTime);
        }

        if (tile.exists) {
          // Update existing item with new image
          response = await fetch(`http://localhost:5001/api/carousel/${tile.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        } else {
          // Create new item
          response = await fetch('http://localhost:5001/api/carousel', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        const updatedTiles = [...tiles];
        updatedTiles[tileIndex].id = data._id || data.id;
        updatedTiles[tileIndex].exists = true;
        updatedTiles[tileIndex].image = data.image;
        updatedTiles[tileIndex].tempFile = null;
        updatedTiles[tileIndex].imagePreview = null;
        setTiles(updatedTiles);
        
        // Update carousel items with the new data
        const updatedCarouselItems = [...carouselItems];
        const existingIndex = updatedCarouselItems.findIndex(item => item._id === data._id);
        if (existingIndex >= 0) {
          updatedCarouselItems[existingIndex] = data;
        } else {
          updatedCarouselItems.push(data);
        }
        setCarouselItems(updatedCarouselItems);
        
        showAlert('Tile saved successfully!', 'success');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showAlert(`Failed to save tile: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showAlert('Error saving tile: ' + err.message, 'error');
    }
  };

  const handleDeleteTile = async (tileIndex) => {
    const tile = tiles[tileIndex];
    
    if (!tile.exists) {
      // If tile doesn't exist in database, just clear the form
      const updatedTiles = [...tiles];
      updatedTiles[tileIndex] = {
        id: `tile-${tile.order}`,
        order: tile.order,
        title: '',
        description: '',
        type: 'image',
        image: '',
        eventDate: '',
        eventTime: '',
        isActive: false,
        exists: false
      };
      setTiles(updatedTiles);
      return;
    }

    if (window.confirm('Are you sure you want to delete this carousel item?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/carousel/${tile.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const updatedTiles = [...tiles];
          updatedTiles[tileIndex] = {
            id: `tile-${tile.order}`,
            order: tile.order,
            title: '',
            description: '',
            type: 'image',
            image: '',
            eventDate: '',
            eventTime: '',
            isActive: false,
            exists: false
          };
          setTiles(updatedTiles);
          
          // Remove the deleted item from carousel items
          const updatedCarouselItems = carouselItems.filter(item => item._id !== tile.id);
          setCarouselItems(updatedCarouselItems);
          
          showAlert('Tile deleted successfully!', 'success');
        } else {
          showAlert('Failed to delete tile', 'error');
        }
      } catch (err) {
        showAlert('Error deleting tile', 'error');
      }
    }
  };

  

  const handleTileImageUpload = async (sectionIndex, file) => {
    if (!file) return;
    
    // Store the file temporarily for later upload
    const updatedSections = [...homeSections];
    updatedSections[sectionIndex].tempTileFile = file;
    updatedSections[sectionIndex].tileImagePreview = URL.createObjectURL(file);
    setHomeSections(updatedSections);
    
    showAlert('Tile image selected! Click "Update Section" to upload and save.', 'info');
  };

  // Function to refresh home sections data
  const refreshHomeSections = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/home-sections');
      if (response.ok) {
        const sections = await response.json();
        setHomeSections(sections);
      }
    } catch (err) {
    }
  };

  // Redirect if not an editor or admin
  if (!authLoading && !isEditor && !isAdmin) {
    return (
      <div className="edit-home-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to edit home page content.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="edit-home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading home page editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-home-page">
      <div className="edit-home-page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Edit Home Page</h1>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {alert.show && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-message">{alert.message}</span>
          <button className="alert-close" onClick={hideAlert}>×</button>
        </div>
      )}

      <div className="carousel-section">
        <div className="section-header">
          <h2>Carousel</h2>
        </div>
        
        <div className="tabbed-interface">
          <div className="tab-navigation">
            {tiles.map((tile, index) => (
              <button
                key={tile.id}
                className={`tab-button ${activeTab === index ? 'active' : ''}`}
                onClick={() => handleTabClick(index)}
              >
                Slide {tile.order}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {tiles.map((tile, index) => (
              <div 
                key={tile.id} 
                className={`tab-pane ${activeTab === index ? 'active' : ''}`}
              >
                <div className="tile-header">
                  <h3>Slide {tile.order}</h3>
                  <div className="tile-type-selector">
                    <label>
                      <input
                        type="radio"
                        name={`type-${index}`}
                        value="image"
                        checked={tile.type === 'image'}
                        onChange={() => handleTypeChange(index, 'image')}
                      />
                      Image
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`type-${index}`}
                        value="event"
                        checked={tile.type === 'event'}
                        onChange={() => handleTypeChange(index, 'event')}
                      />
                      Event
                    </label>
                  </div>
                </div>

                <div className="tile-content">
                  <div className="tile-left-section">
                    <div className="form-group">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={tile.title}
                        onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                        placeholder="Enter title"
                        maxLength="100"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={tile.description}
                        onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                        placeholder="Enter description"
                        maxLength="500"
                        rows="3"
                      />
                    </div>

                    {tile.type === 'event' && (
                      <div className="event-fields-row">
                        <div className="event-field-with-icon">
                          <span className="event-icon">🗓️</span>
                          <input
                            type="date"
                            value={tile.eventDate || ''}
                            onChange={(e) => handleInputChange(index, 'eventDate', e.target.value)}
                            required
                          />
                        </div>

                        <div className="event-field-with-icon">
                          <span className="event-icon">🕒</span>
                          <input
                            type="time"
                            value={tile.eventTime || ''}
                            onChange={(e) => handleInputChange(index, 'eventTime', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={tile.isActive}
                          onChange={(e) => handleInputChange(index, 'isActive', e.target.checked)}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="tile-right-section">
                    <div className="form-group">
                      <label>Image:</label>
                      <div className="image-upload-section">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                          id={`image-upload-${index}`}
                        />
                        
                        {tile.image && !tile.imagePreview && (
                          <div className="image-preview">
                            <img 
                              src={tile.image.startsWith('http') ? tile.image : `http://localhost:5001${tile.image}`} 
                              alt="Preview" 
                            />
                          </div>
                        )}
                        {tile.imagePreview && (
                          <div className="image-preview">
                            <img 
                              src={tile.imagePreview} 
                              alt="New Preview" 
                            />
                            <div className="preview-label">New Image Selected</div>
                          </div>
                        )}
                        
                        <label htmlFor={`image-upload-${index}`} className="upload-button">
                          {tile.image ? 'Change' : 'Upload Image'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tile-actions">
                  <button 
                    className="save-btn"
                    onClick={() => handleSaveTile(index)}
                  >
                    {tile.exists ? 'Update' : 'Save'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteTile(index)}
                  >
                    {tile.exists ? 'Delete' : 'Clear'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Sections Section */}
      <div className="sections-section">
        <div className="section-header">
          <h2>Sections</h2>
        </div>
        
        <div className="sections-grid">
          
          {homeSections.map((section, index) => {
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
                            value={formData.order || section.order}
                            onChange={(e) => handleSectionInputChange(section._id, 'order', parseInt(e.target.value))}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Title:</label>
                          <input
                            type="text"
                            value={formData.title || section.title}
                            onChange={(e) => handleSectionInputChange(section._id, 'title', e.target.value)}
                          />
                        </div>
                        
                        {/* Description and Image side by side */}
                        <div className="description-image-row">
                          <div className="form-group description-group">
                            <label>Description:</label>
                            <textarea
                              value={formData.description || section.description}
                              onChange={(e) => handleSectionInputChange(section._id, 'description', e.target.value)}
                              rows="6"
                            />
                          </div>
                          
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

                  {/* Right Section - Image Upload and Actions */}
                  <div className="section-right">
                    <div className="section-actions">
                      {isEditing ? (
                        <>
                          <button 
                            key="save" 
                            onClick={() => handleSaveSection(section._id)} 
                            className="btn-save"
                          >
                            Save
                          </button>
                          <button 
                            key="cancel" 
                            onClick={() => handleCancelEdit(section._id)} 
                            className="btn-cancel"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          key="edit" 
                          onClick={() => handleEditSection(section._id)} 
                          className="btn-edit"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {/* Image upload section - always visible */}
                    <div className="form-group">
                      <div className="image-upload-section">
                        {(section.tileImagePreview || section.tileImage) && (
                          <div className="image-preview">
                            <img 
                              src={section.tileImagePreview || section.tileImage} 
                              alt="Tile Preview" 
                            />
                          </div>
                        )}
                        {/* Only show upload controls when editing or when no image exists */}
                        {(isEditing || !section.tileImage) && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleTileImageUpload(index, e.target.files[0])}
                              id={`tile-upload-${index}`}
                            />
                            <label htmlFor={`tile-upload-${index}`} className="upload-button">
                              {section.tempTileFile ? 'Tile Selected ✓' : (section.tileImage ? 'Change Tile' : 'Upload Tile')}
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EditHomePage;

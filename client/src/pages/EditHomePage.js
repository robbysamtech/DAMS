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

  // Fetch existing carousel items
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        setLoading(true);
        console.log('Fetching carousel items with token:', token ? 'Token exists' : 'No token');
        
        const response = await fetch('http://localhost:5001/api/carousel/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to fetch carousel items: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        console.log('Carousel data received:', data);
        setCarouselItems(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching carousel items:', err);
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
          console.log('Home sections data received:', data);
          setHomeSections(data);
        } else {
          console.error('Failed to fetch home sections');
        }
      } catch (err) {
        console.error('Error fetching home sections:', err);
      }
    };

    if (token) {
      fetchCarouselItems();
      fetchHomeSections();
    } else {
      console.log('No token available, skipping fetch');
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

  const handleSectionInputChange = (sectionIndex, field, value) => {
    const updatedSections = [...homeSections];
    updatedSections[sectionIndex][field] = value;
    setHomeSections(updatedSections);
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
      console.log('Starting section update for:', sectionId);
      console.log('Section data:', sectionData);
      
      // Find the section in state to check for temporary files
      const sectionIndex = homeSections.findIndex(s => s._id === sectionId);
      const section = homeSections[sectionIndex];
      
      console.log('Found section at index:', sectionIndex);
      console.log('Section from state:', section);
      console.log('Temporary files:', {
        background: section?.tempBackgroundFile,
        tile: section?.tempTileFile
      });
      
      // Upload background image if a new one was selected
      if (section?.tempBackgroundFile) {
        console.log('Uploading background image...');
        const formData = new FormData();
        formData.append('backgroundImage', section.tempBackgroundFile);
        
        const backgroundResponse = await fetch(`http://localhost:5001/api/home-sections/${sectionId}/background-image`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (backgroundResponse.ok) {
          const backgroundResult = await backgroundResponse.json();
          sectionData.backgroundImage = backgroundResult.backgroundImage;
          console.log('Background image uploaded successfully:', backgroundResult.backgroundImage);
        } else {
          const errorText = await backgroundResponse.text();
          console.error('Background upload failed:', errorText);
          showAlert('Failed to upload background image', 'error');
          return;
        }
      }
      
      // Upload tile image if a new one was selected
      if (section?.tempTileFile) {
        console.log('Uploading tile image...');
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
          console.log('Tile image uploaded successfully:', tileResult.tileImage);
        } else {
          const errorText = await tileResponse.text();
          console.error('Tile upload failed:', errorText);
          showAlert('Failed to upload tile image', 'error');
          return;
        }
      }
      
      console.log('Final section data to update:', sectionData);
      
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
        console.log('Section updated successfully:', updatedSection);
        
        setHomeSections(prev => 
          prev.map(section => 
            section._id === updatedSection._id ? updatedSection : section
          )
        );
        
        // Clear temporary files and previews
        const updatedSections = [...homeSections];
        if (updatedSections[sectionIndex]) {
          updatedSections[sectionIndex].tempBackgroundFile = null;
          updatedSections[sectionIndex].tempTileFile = null;
          updatedSections[sectionIndex].backgroundImagePreview = null;
          updatedSections[sectionIndex].tileImagePreview = null;
          setHomeSections(updatedSections);
        }
        
        showAlert('Section updated successfully!', 'success');
        
        // Refresh the home sections data to ensure UI shows latest images
        await refreshHomeSections();
      } else {
        const errorText = await response.text();
        console.error('Section update failed:', errorText);
        showAlert('Failed to update section', 'error');
      }
    } catch (err) {
      console.error('Error updating section:', err);
      showAlert(`Error updating section: ${err.message}`, 'error');
    }
  };

  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const handleImageUpload = async (tileIndex, file) => {
    if (!file) return;

    console.log('File selected for tile:', tileIndex);
    console.log('File details:', file.name, file.type, file.size);

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
      console.error('Error saving tile:', err);
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
        console.error('Error deleting tile:', err);
        showAlert('Error deleting tile', 'error');
      }
    }
  };

  const handleBackgroundImageUpload = async (sectionIndex, file) => {
    if (!file) return;
    
    // Store the file temporarily for later upload
    const updatedSections = [...homeSections];
    updatedSections[sectionIndex].tempBackgroundFile = file;
    updatedSections[sectionIndex].backgroundImagePreview = URL.createObjectURL(file);
    setHomeSections(updatedSections);
    
    showAlert('Background image selected! Click "Update Section" to upload and save.', 'info');
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
        console.log('Home sections refreshed:', sections);
      }
    } catch (err) {
      console.error('Error refreshing home sections:', err);
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
          {homeSections.map((section, index) => (
            <div key={section._id} className="section-tile">
              <div className="section-tile-header">
                <h3>Section {section.order}</h3>
                <div className="section-status">
                  <label>
                    <input
                      type="checkbox"
                      checked={section.isActive}
                      onChange={(e) => handleSectionInputChange(index, 'isActive', e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="section-tile-content">
                {/* Left Section - Title, Description, Update Button */}
                <div className="section-left">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionInputChange(index, 'title', e.target.value)}
                      placeholder="Enter section title"
                      maxLength="100"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={section.description}
                      onChange={(e) => handleSectionInputChange(index, 'description', e.target.value)}
                      placeholder="Enter section description"
                      maxLength="500"
                      rows="4"
                    />
                  </div>

                  <div className="section-tile-actions">
                    <button 
                      className="save-btn"
                      onClick={() => handleSectionUpdate(section._id, section)}
                    >
                      Update Section
                    </button>
                    {(section.tempBackgroundFile || section.tempTileFile) && (
                      <small className="upload-note">
                        📁 Files selected - will be uploaded when you click Update Section
                      </small>
                    )}
                  </div>
                </div>

                {/* Right Section - Image Uploads */}
                <div className="section-right">
                  <div className="form-group">
                    <label>Background Image:</label>
                    <div className="image-upload-section">
                      {(section.backgroundImagePreview || section.backgroundImage) && (
                        <div className="image-preview">
                          <img 
                            src={section.backgroundImagePreview || section.backgroundImage} 
                            alt="Background Preview" 
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBackgroundImageUpload(index, e.target.files[0])}
                        id={`background-upload-${index}`}
                      />
                      <label htmlFor={`background-upload-${index}`} className="upload-button">
                        {section.tempBackgroundFile ? 'Background Selected ✓' : (section.backgroundImage ? 'Change Background' : 'Upload Background')}
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tile Image:</label>
                    <div className="image-upload-section">
                      {(section.tileImagePreview || section.tileImage) && (
                        <div className="image-preview">
                          <img 
                            src={section.tileImagePreview || section.tileImage} 
                            alt="Tile Preview" 
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTileImageUpload(index, e.target.files[0])}
                        id={`tile-upload-${index}`}
                      />
                      <label htmlFor={`tile-upload-${index}`} className="upload-button">
                        {section.tempTileFile ? 'Tile Selected ✓' : (section.tileImage ? 'Change Tile' : 'Upload Tile')}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditHomePage;

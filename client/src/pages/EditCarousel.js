import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditCarousel.css';

const EditCarousel = () => {
  const { isEditor, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (token) {
      fetchCarouselItems();
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

    alert('Image selected! Click Save to upload and save the tile.');
  };

  const handleSaveTile = async (tileIndex) => {
    const tile = tiles[tileIndex];
    
    if (!tile.title || !tile.description) {
      alert('Please fill in title and description');
      return;
    }

    // Check if we have an image (either existing or new file)
    if (!tile.image && !tile.tempFile) {
      alert('Please select an image for this tile');
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
            alert('Please fill in event date and time for event type cards');
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
            alert('Please fill in event date and time for event type cards');
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
        
        alert('Tile saved successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to save tile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving tile:', err);
      alert('Error saving tile: ' + err.message);
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
          
          alert('Tile deleted successfully!');
        } else {
          alert('Failed to delete tile');
        }
      } catch (err) {
        console.error('Error deleting tile:', err);
        alert('Error deleting tile');
      }
    }
  };

  // Redirect if not an editor
  if (!authLoading && !isEditor) {
    return (
      <div className="edit-carousel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to edit carousel content.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="edit-carousel">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading carousel editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-carousel">
      <div className="edit-carousel-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Edit Carousel Content</h1>
        <p>Manage your carousel items. Each tile represents a carousel slide.</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="carousel-grid">
        {tiles.map((tile, index) => (
          <div key={tile.id} className={`carousel-tile ${tile.exists ? 'has-content' : 'empty'}`}>
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

              <div className="form-group">
                <label>Image:</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
                    id={`image-upload-${index}`}
                  />
                  <label htmlFor={`image-upload-${index}`} className="upload-button">
                    {tile.image ? 'Change Image' : 'Upload Image'}
                  </label>
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
                </div>
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
  );
};

export default EditCarousel;

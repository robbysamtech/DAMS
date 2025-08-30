import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Events.css';

const Events = () => {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    eventImage: null
  });
  const [locations, setLocations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        console.error('Failed to fetch locations:', response.status);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    // Add timeout to prevent freezing
    const timeoutId = setTimeout(() => {
      setError('Request timeout - server may be slow');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      const response = await fetch('http://localhost:5001/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId); // Clear timeout if successful
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      } else {
        console.error('Response not ok:', response.status);
        setError('Failed to fetch events');
      }
    } catch (err) {
      clearTimeout(timeoutId); // Clear timeout if error
      console.error('Error in fetchEvents:', err);
      setError('Error fetching events');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchLocations();
      fetchEvents();
    } else {
      setLoading(false); // Don't keep loading if no token
    }
  }, [token, fetchLocations, fetchEvents]);

  // Real-time search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event => {
      const query = searchQuery.toLowerCase();
      return (
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.name?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  // Cleanup fullscreen classes when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('fullscreen-active');
      document.documentElement.classList.remove('fullscreen-active');
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'eventImage' && files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (imageFile) => {
    if (!imageFile) return null;
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.imageUrl;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let imageUrl = null;
      if (formData.eventImage) {
        imageUrl = await handleImageUpload(formData.eventImage);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        eventImage: imageUrl
      };

      const response = await fetch('http://localhost:5001/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [newEvent.event, ...prev]);
        resetForm();
        setShowCreateForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Error creating event');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
      time: event.time,
      location: event.location?._id || event.location,
      eventImage: null
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      let imageUrl = editingEvent.eventImage; // Keep existing image if no new one
      if (formData.eventImage) {
        imageUrl = await handleImageUpload(formData.eventImage);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        eventImage: imageUrl
      };

      const response = await fetch(`http://localhost:5001/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(prev => prev.map(event => 
          event._id === editingEvent._id ? updatedEvent.event : event
        ));
        resetForm();
        setEditingEvent(null);
        setShowCreateForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update event');
      }
    } catch (err) {
      setError('Error updating event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      eventImage: null
    });
    setEditingEvent(null);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowFullScreen(true);
    document.body.classList.add('fullscreen-active');
    document.documentElement.classList.add('fullscreen-active');
  };

  const closeFullScreen = () => {
    setShowFullScreen(false);
    setSelectedEvent(null);
    document.body.classList.remove('fullscreen-active');
    document.documentElement.classList.remove('fullscreen-active');
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event._id !== eventId));
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Error deleting event');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const truncateDescription = (description, maxLength = 120) => {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength).trim() + '...';
  };



  if (loading) {
    return (
      <div className="events-page">
        <div className="container">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="container">
        <div className="events-header">
          <h1>Ministry Events</h1>
          <p>Manage and view upcoming ministry events</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">&times;</button>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events by title, description, location, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="search-results">
            {searchQuery && (
              <p>Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {user?.role === 'editor' && (
          <div className="create-event-section">
            <button 
              onClick={() => {
                if (editingEvent) {
                  resetForm();
                } else {
                  setShowCreateForm(!showCreateForm);
                }
              }}
              className="btn btn-primary"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: '2px solid #2563eb',
                padding: '0.875rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '120px'
              }}
            >
              {showCreateForm ? 'Cancel' : '➕ Create New Event'}
            </button>

            {showCreateForm && (
              <form onSubmit={editingEvent ? handleUpdate : handleSubmit} className="create-event-form">
                <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                
                <div className="form-group">
                  <label htmlFor="title">Event Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Describe the event"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time">Time</label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select a time</option>
                      {Array.from({ length: 96 }, (_, i) => {
                        const hour = Math.floor(i / 4);
                        const minute = (i % 4) * 15;
                        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        return (
                          <option key={timeString} value={timeString}>
                            {displayHour}:{minute.toString().padStart(2, '0')} {ampm}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select a location</option>
                    {locations.map(location => (
                      <option key={location._id} value={location._id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="eventImage">Event Image (Optional)</label>
                  <input
                    type="file"
                    id="eventImage"
                    name="eventImage"
                    onChange={handleInputChange}
                    className="form-input"
                    accept="image/*"
                  />
                  {editingEvent?.eventImage && (
                    <div className="current-image">
                      <p>Current image:</p>
                      <img 
                        src={editingEvent.eventImage} 
                        alt="Current event" 
                        className="current-image-preview"
                      />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    style={{
                      backgroundColor: '#059669',
                      color: 'white',
                      border: '2px solid #059669',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '44px',
                      minWidth: '120px'
                    }}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      resetForm();
                      setShowCreateForm(false);
                    }}
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: '#64748b',
                      color: 'white',
                      border: '2px solid #64748b',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '44px',
                      minWidth: '120px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="events-list">
          <h2>Events ({filteredEvents.length})</h2>
          
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              {searchQuery ? (
                <p>No events found matching "{searchQuery}".</p>
              ) : (
                <p>No events scheduled yet.</p>
              )}
              {user?.role === 'editor' && !searchQuery && (
                <p>Create your first event to get started!</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(event => (
                <div key={event._id} className="event-card" onClick={() => handleEventClick(event)}>
                  {event.eventImage && (
                    <div className="event-image">
                      <img 
                        src={event.eventImage} 
                        alt={event.title}
                        className="event-image-preview"
                      />
                    </div>
                  )}
                  
                  <div className="event-header">
                    <h3>{event.title}</h3>
                  </div>
                  
                  <div className="event-details">
                    <p className="event-description">{truncateDescription(event.description)}</p>
                    
                    <div className="event-meta">
                      <div className="event-date">
                        <span className="icon">🗓️</span>
                        {formatDate(event.date)}
                      </div>
                      
                      <div className="event-time">
                        <span className="icon">🕒</span>
                        {formatTime(event.time)}
                      </div>
                      
                      <div className="event-location">
                        <span className="icon">📍</span>
                        {event.location?.name || 'Location not set'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-actions">
                    {user?.role === 'editor' && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(event);
                          }}
                          className="btn-edit"
                          title="Edit event"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event._id);
                          }}
                          className="btn-delete"
                          title="Delete event"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Event View */}
      {showFullScreen && selectedEvent && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-content">
            {/* Header with event title only */}
            <div className="fullscreen-header-section">
              <div className="fullscreen-title-section">
                <h1 className="fullscreen-main-title">{selectedEvent.title}</h1>
                <div className="fullscreen-subtitle">
                  {selectedEvent.category && (
                    <span className="category-badge">{selectedEvent.category}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="fullscreen-body">
              {/* Left side - Hero Image Section */}
              <div className="fullscreen-left">
                <div className="hero-image-container">
                  {selectedEvent.eventImage ? (
                    <div className="hero-image-wrapper">
                      <img 
                        src={selectedEvent.eventImage} 
                        alt={selectedEvent.title}
                        className="hero-image"
                      />
                      <div className="image-overlay">
                        <div className="image-overlay-content">
                          <span className="overlay-icon">📸</span>
                          <p>Event Image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="hero-image-placeholder">
                      <div className="placeholder-content">
                        <span className="placeholder-icon">🗓️</span>
                        <h3>No Image Available</h3>
                        <p>This event doesn't have an image yet</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick Info Cards */}
                <div className="quick-info-grid">
                  <div className="info-card primary">
                    <div className="info-card-icon">🗓️</div>
                    <div className="info-card-content">
                      <h4>Date</h4>
                      <p>{formatDate(selectedEvent.date)}</p>
                    </div>
                  </div>
                  
                  <div className="info-card secondary">
                    <div className="info-card-icon">🕒</div>
                    <div className="info-card-content">
                      <h4>Time</h4>
                      <p>{formatTime(selectedEvent.time)}</p>
                    </div>
                  </div>
                  
                  <div className="info-card accent">
                    <div className="info-card-icon">📍</div>
                    <div className="info-card-content">
                      <h4>Location</h4>
                      <p>{selectedEvent.location?.name || 'Location not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Event Details */}
              <div className="fullscreen-right">
                {/* Description Section */}
                <div className="detail-section description-section full-height">
                  <div className="section-header">
                    <h2>📝 About This Event</h2>
                  </div>
                  <div className="description-content scrollable">
                    <div className="description-text-scrollable">
                      <p>{selectedEvent.description}</p>
                    </div>
                  </div>
                  
                  {/* Back button below description */}
                  <div className="description-back-btn-container">
                    <button className="fullscreen-back-btn" onClick={closeFullScreen}>
                      <span className="back-icon">←</span>
                      <span>Back to Events</span>
                    </button>
                  </div>
                </div>
                
                
                
                {/* Tags Section */}
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="detail-section">
                    <div className="section-header">
                      <h2>🏷️ Tags</h2>
                      <div className="section-divider"></div>
                    </div>
                    <div className="tags-container">
                      {selectedEvent.tags.map((tag, index) => (
                        <span key={index} className="tag-item">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                

                

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;

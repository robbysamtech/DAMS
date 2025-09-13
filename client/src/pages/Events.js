import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Events.css';

const Events = () => {
  const { user, token, isEditor, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [filteredUpcomingEvents, setFilteredUpcomingEvents] = useState([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState([]);
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
    address: {
      streetAddress: '',
      city: '',
      state: '',
      zipCode: ''
    },
    eventImage: null
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);


  // Helper function to get full address display
  const getAddressDisplay = useCallback((event) => {
    if (!event.address) return 'Address not set';
    
    const addressParts = [];
    if (event.address.streetAddress) addressParts.push(event.address.streetAddress);
    if (event.address.city) addressParts.push(event.address.city);
    if (event.address.state) addressParts.push(event.address.state);
    if (event.address.zipCode) addressParts.push(event.address.zipCode);
    
    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }
    
    return 'Address not set';
  }, []);


  const fetchEvents = useCallback(async () => {
    // Add timeout to prevent freezing
    const timeoutId = setTimeout(() => {
      setError('Request timeout - server may be slow');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      const response = await fetch('http://localhost:5001/api/events', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId); // Clear timeout if successful
      
      if (response.ok) {
        const data = await response.json();
        console.log('Events data received:', data.events);
        console.log('First event location:', data.events?.[0]?.location);
        const eventsData = data.events || [];
        setEvents(eventsData);
        reclassifyEvents(eventsData);
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
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time search filtering for both upcoming and past events
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUpcomingEvents(upcomingEvents);
      setFilteredPastEvents(pastEvents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filterEvents = (eventsList) => {
      return eventsList.filter(event => {
        return (
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          getAddressDisplay(event).toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      });
    };

    const filteredUpcoming = filterEvents(upcomingEvents);
    const filteredPast = filterEvents(pastEvents);
    
    setFilteredUpcomingEvents(filteredUpcoming);
    setFilteredPastEvents(filteredPast);
  }, [searchQuery, upcomingEvents, pastEvents, events, getAddressDisplay]);

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
    } else if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
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
        address: formData.address,
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
        const updatedEvents = [newEvent.event, ...events];
        setEvents(updatedEvents);
        reclassifyEvents(updatedEvents);
        closeCreateModal();
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
      address: event.address || {
        streetAddress: '',
        city: '',
        state: '',
        zipCode: ''
      },
      eventImage: null
    });
    setShowEditModal(true);
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
        address: formData.address,
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
        const updatedEvents = events.map(event => 
          event._id === editingEvent._id ? updatedEvent.event : event
        );
        setEvents(updatedEvents);
        reclassifyEvents(updatedEvents);
        closeEditModal();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update event');
      }
    } catch (err) {
      setError('Error updating event');
    }
  };

  const handleDelete = async (eventId) => {
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
        const updatedEvents = events.filter(event => event._id !== eventId);
        setEvents(updatedEvents);
        reclassifyEvents(updatedEvents);
        setError('');
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Error deleting event');
    }
  };

  // Helper function to reclassify events into upcoming and past
  const reclassifyEvents = (eventsList) => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    
    eventsList.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });
    
    // Sort upcoming events by date (ascending)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sort past events by date (descending - most recent first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setUpcomingEvents(upcoming);
    setPastEvents(past);
    setFilteredUpcomingEvents(upcoming);
    setFilteredPastEvents(past);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      address: {
        streetAddress: '',
        city: '',
        state: '',
        zipCode: ''
      },
      eventImage: null
    });
    setEditingEvent(null);
    setShowCreateForm(false);
    setShowEditModal(false);
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEvent(null);
    resetForm();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
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

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">&times;</button>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-row">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search events by title, description, address, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            {(isEditor || isAdmin) && (
              <div className="search-actions">
                <button 
                  onClick={openCreateModal}
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
                  +New Event
                </button>
              </div>
            )}
          </div>
          <div className="search-results">
            {searchQuery && (
              <p>Found {filteredUpcomingEvents.length + filteredPastEvents.length} event{(filteredUpcomingEvents.length + filteredPastEvents.length) !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="events-section">
          <div className="section-header">
            <h2>Upcoming Events ({filteredUpcomingEvents.length})</h2>
            <div className="section-indicator upcoming">●</div>
          </div>
          
          {filteredUpcomingEvents.length === 0 ? (
            <div className="no-events">
              {searchQuery ? (
                <p>No upcoming events found matching "{searchQuery}".</p>
              ) : (
                <p>No upcoming events scheduled.</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {filteredUpcomingEvents.map(event => (
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
                        {getAddressDisplay(event)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-actions">
                    {(isEditor || isAdmin) && (
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
                            handleDelete(event._id);
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

        {/* Past Events Section */}
        <div className="events-section">
          <div className="section-header">
            <h2>Past Events ({filteredPastEvents.length})</h2>
            <div className="section-indicator past">●</div>
          </div>
          
          {filteredPastEvents.length === 0 ? (
            <div className="no-events">
              {searchQuery ? (
                <p>No past events found matching "{searchQuery}".</p>
              ) : (
                <p>No past events available.</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {filteredPastEvents.map(event => (
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
                        {getAddressDisplay(event)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-actions">
                    {(isEditor || isAdmin) && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(event);
                          }}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event._id);
                          }}
                          className="btn-delete"
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
                      <p>{getAddressDisplay(selectedEvent)}</p>
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

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button className="modal-close" onClick={closeEditModal}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} className="edit-event-form">
              <div className="form-group">
                <label htmlFor="edit-title">Event Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
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
                  <label htmlFor="edit-date">Date</label>
                  <input
                    type="date"
                    id="edit-date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-time">Time</label>
                  <select
                    id="edit-time"
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
                <label>Address Details (Optional)</label>
                <div className="address-fields">
                  <input
                    type="text"
                    name="address.streetAddress"
                    value={formData.address.streetAddress}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Street Address"
                    required
                  />
                  <div className="address-row">
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="State"
                      required
                    />
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="ZIP Code"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-eventImage">Event Image (Optional)</label>
                <input
                  type="file"
                  id="edit-eventImage"
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

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn btn-success"
                >
                  Update Event
                </button>
                <button 
                  type="button" 
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button className="modal-close" onClick={closeCreateModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="create-event-form">
              <div className="form-group">
                <label htmlFor="create-title">Event Title</label>
                <input
                  type="text"
                  id="create-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-description">Description</label>
                <textarea
                  id="create-description"
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
                  <label htmlFor="create-date">Date</label>
                  <input
                    type="date"
                    id="create-date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-time">Time</label>
                  <select
                    id="create-time"
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
                <label>Address Details</label>
                <div className="address-fields">
                  <input
                    type="text"
                    name="address.streetAddress"
                    value={formData.address.streetAddress}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Street Address"
                    required
                  />
                  <div className="address-row">
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="State"
                      required
                    />
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="ZIP Code"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="create-eventImage">Event Image (Optional)</label>
                <input
                  type="file"
                  id="create-eventImage"
                  name="eventImage"
                  onChange={handleInputChange}
                  className="form-input"
                  accept="image/*"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn btn-success"
                >
                  Create Event
                </button>
                <button 
                  type="button" 
                  onClick={closeCreateModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;

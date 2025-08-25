import React, { useState, useEffect } from 'react';
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Events fetched:', data.events);
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token]);

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
        event.location?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

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
        console.log('Image upload response:', data);
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

      console.log('Sending event data to server:', eventData);

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
        console.log('New event created:', newEvent.event);
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
      location: event.location,
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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
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

        {user?.role === 'creator' && (
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
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter event location"
                    required
                  />
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
              {user?.role === 'creator' && !searchQuery && (
                <p>Create your first event to get started!</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(event => {
                console.log('Rendering event:', event);
                return (
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
                    <div className="event-actions">
                      <span className="click-hint" title="Click to view details">👁️</span>
                      {user?.role === 'creator' && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                            className="btn-edit"
                            title="Edit event"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(event._id);
                            }}
                            className="btn-delete"
                            title="Delete event"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="event-details">
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-meta">
                      <div className="event-date">
                        <span className="icon">📅</span>
                        {formatDate(event.date)}
                      </div>
                      
                      <div className="event-time">
                        <span className="icon">🕒</span>
                        {event.time}
                      </div>
                      
                      <div className="event-location">
                        <span className="icon">📍</span>
                        {event.location}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            
            <div className="modal-body">
              {/* Left Half - Image */}
              <div className="modal-left">
                {selectedEvent.eventImage ? (
                  <div className="modal-image-container">
                    <img 
                      src={selectedEvent.eventImage} 
                      alt={selectedEvent.title}
                      className="modal-image"
                    />
                  </div>
                ) : (
                  <div className="modal-image-placeholder">
                    <span className="placeholder-icon">📅</span>
                    <p>No Image Available</p>
                  </div>
                )}
              </div>
              
              {/* Right Half - Event Details */}
              <div className="modal-right">
                <div className="modal-header">
                  <h2>{selectedEvent.title}</h2>
                  <div className="modal-meta">
                    <span className="modal-date">
                      <span className="icon">📅</span>
                      {formatDate(selectedEvent.date)}
                    </span>
                    <span className="modal-time">
                      <span className="icon">🕒</span>
                      {selectedEvent.time}
                    </span>
                  </div>
                </div>
                
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>{selectedEvent.description}</p>
                </div>
                
                <div className="modal-location">
                  <h3>Location</h3>
                  <p>
                    <span className="icon">📍</span>
                    {selectedEvent.location}
                  </p>
                </div>
                
                {selectedEvent.category && (
                  <div className="modal-category">
                    <h3>Category</h3>
                    <p>{selectedEvent.category}</p>
                  </div>
                )}
                
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="modal-tags">
                    <h3>Tags</h3>
                    <div className="tags-list">
                      {selectedEvent.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEvent.maxAttendees && (
                  <div className="modal-attendees">
                    <h3>Maximum Attendees</h3>
                    <p>{selectedEvent.maxAttendees} people</p>
                  </div>
                )}
                
                {selectedEvent.registrationRequired && (
                  <div className="modal-registration">
                    <h3>Registration</h3>
                    <p>Registration is required for this event</p>
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

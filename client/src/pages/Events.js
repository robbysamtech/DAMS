import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Events.css';

const Events = () => {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });

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
        setEvents(data.events || []);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [newEvent.event, ...prev]);
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
          location: ''
        });
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

        {user?.role === 'creator' && (
          <div className="create-event-section">
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
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
              <form onSubmit={handleSubmit} className="create-event-form">
                <h3>Create New Event</h3>
                
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
                    Create Event
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
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
          <h2>Upcoming Events ({events.length})</h2>
          
          {events.length === 0 ? (
            <div className="no-events">
              <p>No events scheduled yet.</p>
              {user?.role === 'creator' && (
                <p>Create your first event to get started!</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <div key={event._id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    {user?.role === 'creator' && (
                      <button 
                        onClick={() => deleteEvent(event._id)}
                        className="btn-delete"
                        title="Delete event"
                      >
                        🗑️
                      </button>
                    )}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;

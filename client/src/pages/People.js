import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './People.css';

const People = () => {
  const { user, token } = useAuth();
  const [people, setPeople] = useState([]);
  const [ministrySections, setMinistrySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    bio: '',
    ministrySection: ''
  });
  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    description: ''
  });

  const fetchPeople = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/people', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      } else {
        setError('Failed to fetch people');
      }
    } catch (err) {
      setError('Error fetching people');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMinistrySections = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/ministry', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMinistrySections(data.ministrySections || []);
      }
    } catch (err) {
      console.error('Error fetching ministry sections:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchPeople();
    fetchMinistrySections();
  }, [fetchPeople, fetchMinistrySections]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSectionInputChange = (e) => {
    const { name, value } = e.target;
    setSectionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/people', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newPerson = await response.json();
        setPeople(prev => [newPerson.person, ...prev]);
        setFormData({
          firstName: '',
          lastName: '',
          jobTitle: '',
          department: '',
          bio: '',
          ministrySection: ''
        });
        setShowCreateForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create person');
      }
    } catch (err) {
      setError('Error creating person');
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/ministry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectionFormData)
      });

      if (response.ok) {
        const newSection = await response.json();
        setMinistrySections(prev => [newSection.ministrySection, ...prev]);
        setSectionFormData({
          name: '',
          description: ''
        });
        setShowSectionForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create ministry section');
      }
    } catch (err) {
      setError('Error creating ministry section');
    }
  };

  const deletePerson = async (personId) => {
    if (!window.confirm('Are you sure you want to delete this person?')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/people/${personId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPeople(prev => prev.filter(person => person._id !== personId));
      } else {
        setError('Failed to delete person');
      }
    } catch (err) {
      setError('Error deleting person');
    }
  };

  const deleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this ministry section? This will also remove all people in this section.')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/ministry/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMinistrySections(prev => prev.filter(section => section._id !== sectionId));
        // Also remove people from this section
        setPeople(prev => prev.filter(person => person.ministrySection !== sectionId));
      } else {
        setError('Failed to delete ministry section');
      }
    } catch (err) {
      setError('Error deleting ministry section');
    }
  };

  const getSectionName = (sectionId) => {
    const section = ministrySections.find(s => s._id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  if (loading) {
    return (
      <div className="people-page">
        <div className="container">
          <div className="loading">Loading ministry team...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="people-page">
      <div className="container">
        <div className="people-header">
          <h1>Ministry Team</h1>
          <p>Manage your ministry team members and sections</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">&times;</button>
          </div>
        )}

        {user?.role === 'creator' && (
          <div className="creator-actions">
            <div className="action-buttons">
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn btn-primary"
              >
                {showCreateForm ? 'Cancel' : '👤 Add Team Member'}
              </button>
              
              <button 
                onClick={() => setShowSectionForm(!showSectionForm)}
                className="btn btn-secondary"
              >
                {showSectionForm ? 'Cancel' : '🏗️ Create Section'}
              </button>
            </div>

            {/* Create Person Form */}
            {showCreateForm && (
              <form onSubmit={handleSubmit} className="create-form">
                <h3>Add New Team Member</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="jobTitle">Job Title</label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Pastor, Ministry Leader"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="ministrySection">Ministry Section</label>
                    <select
                      id="ministrySection"
                      name="ministrySection"
                      value={formData.ministrySection}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select a section</option>
                      {ministrySections.map(section => (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Worship, Children's Ministry"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Brief description of their role and background"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    Add Team Member
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Create Section Form */}
            {showSectionForm && (
              <form onSubmit={handleSectionSubmit} className="create-form">
                <h3>Create New Ministry Section</h3>
                
                <div className="form-group">
                  <label htmlFor="sectionName">Section Name</label>
                  <input
                    type="text"
                    id="sectionName"
                    name="name"
                    value={sectionFormData.name}
                    onChange={handleSectionInputChange}
                    className="form-input"
                    placeholder="e.g., Worship Ministry, Children's Ministry"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sectionDescription">Description</label>
                  <textarea
                    id="sectionDescription"
                    name="description"
                    value={sectionFormData.description}
                    onChange={handleSectionInputChange}
                    className="form-input"
                    placeholder="Describe what this ministry section does"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    Create Section
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowSectionForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Ministry Sections */}
        <div className="sections-section">
          <h2>Ministry Sections ({ministrySections.length})</h2>
          
          {ministrySections.length === 0 ? (
            <div className="no-sections">
              <p>No ministry sections created yet.</p>
              {user?.role === 'creator' && (
                <p>Create your first ministry section to organize your team!</p>
              )}
            </div>
          ) : (
            <div className="sections-grid">
              {ministrySections.map(section => (
                <div key={section._id} className="section-card">
                  <div className="section-header">
                    <h3>{section.name}</h3>
                    {user?.role === 'creator' && (
                      <button 
                        onClick={() => deleteSection(section._id)}
                        className="btn-delete"
                        title="Delete section"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  <p className="section-description">{section.description}</p>
                  
                  <div className="section-members">
                    <span className="member-count">
                      {people.filter(person => person.ministrySection === section._id).length} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="team-section">
          <h2>Team Members ({people.length})</h2>
          
          {people.length === 0 ? (
            <div className="no-people">
              <p>No team members added yet.</p>
              {user?.role === 'creator' && (
                <p>Add your first team member to get started!</p>
              )}
            </div>
          ) : (
            <div className="people-grid">
              {people.map(person => (
                <div key={person._id} className="person-card">
                  <div className="person-header">
                    <h3>{person.firstName} {person.lastName}</h3>
                    {user?.role === 'creator' && (
                      <button 
                        onClick={() => deletePerson(person._id)}
                        className="btn-delete"
                        title="Delete person"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  <div className="person-details">
                    <div className="person-job">
                      <span className="icon">💼</span>
                      {person.jobTitle}
                    </div>
                    
                    {person.department && (
                      <div className="person-department">
                        <span className="icon">🏢</span>
                        {person.department}
                      </div>
                    )}
                    
                    <div className="person-section">
                      <span className="icon">🏛️</span>
                      {getSectionName(person.ministrySection)}
                    </div>
                    
                    {person.bio && (
                      <p className="person-bio">{person.bio}</p>
                    )}
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

export default People;

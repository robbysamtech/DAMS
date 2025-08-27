import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './People.css';

const People = () => {
  const { user, token } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    bio: '',
    profilePhoto: null
  });
  const [photoPreview, setPhotoPreview] = useState('');

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

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      bio: '',
      profilePhoto: null
    });
    setPhotoPreview('');
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Token:', token);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('jobTitle', formData.jobTitle);
      formDataToSend.append('department', formData.department);
      formDataToSend.append('bio', formData.bio);
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }

      console.log('FormData created:', formDataToSend);

      const response = await fetch('http://localhost:5001/api/people', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const newPerson = await response.json();
        console.log('Success response:', newPerson);
        setPeople(prev => [newPerson.person, ...prev]);
        resetForm();
        setError('');
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setError(errorData.error || 'Failed to create person');
      }
    } catch (err) {
      console.error('Exception during submission:', err);
      setError('Error creating person');
    }
  };

  const handleEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      jobTitle: person.jobTitle || '',
      department: person.department || '',
      bio: person.bio || '',
      profilePhoto: null
    });
    setPhotoPreview(null); // Clear any previous preview
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('jobTitle', formData.jobTitle);
      formDataToSend.append('department', formData.department);
      formDataToSend.append('bio', formData.bio);
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch(`http://localhost:5001/api/people/${editingPerson._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const updatedPerson = await response.json();
        setPeople(prev => prev.map(p => 
          p._id === editingPerson._id ? updatedPerson.person : p
        ));
        resetForm();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update person');
      }
    } catch (err) {
      setError('Error updating person');
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
        setError('');
      } else {
        setError('Failed to delete person');
      }
    } catch (err) {
      setError('Error deleting person');
    }
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
                </div>

                <div className="form-group">
                  <label htmlFor="profilePhoto">Profile Photo</label>
                  <input
                    type="file"
                    id="profilePhoto"
                    name="profilePhoto"
                    onChange={handlePhotoChange}
                    className="form-input"
                    accept="image/*"
                  />
                  {photoPreview && (
                    <div className="photo-preview">
                      <img src={photoPreview} alt="Preview" />
                    </div>
                  )}
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
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Edit Person Form */}
            {showEditForm && editingPerson && (
              <form onSubmit={handleUpdate} className="create-form">
                <h3>Edit Team Member</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editFirstName">First Name</label>
                    <input
                      type="text"
                      id="editFirstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editLastName">Last Name</label>
                    <input
                      type="text"
                      id="editLastName"
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
                    <label htmlFor="editJobTitle">Job Title</label>
                    <input
                      type="text"
                      id="editJobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Pastor, Ministry Leader"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editDepartment">Department</label>
                    <input
                      type="text"
                      id="editDepartment"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Worship, Children's Ministry"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editProfilePhoto">Profile Photo</label>
                  <input
                    type="file"
                    id="editProfilePhoto"
                    name="profilePhoto"
                    onChange={handlePhotoChange}
                    className="form-input"
                    accept="image/*"
                  />
                  
                  {/* Show current image or new preview */}
                  {(photoPreview || editingPerson.profilePhoto) && (
                    <div className="photo-preview">
                      <img 
                        src={photoPreview || `http://localhost:5001/${editingPerson.profilePhoto}`} 
                        alt="Preview" 
                      />
                      {photoPreview && (
                        <p className="preview-note">New image preview</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="editBio">Bio</label>
                  <textarea
                    id="editBio"
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
                    Update Team Member
                  </button>
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

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
              {people.map(person => {
                console.log('Person data:', person);
                console.log('Profile photo path:', person.profilePhoto);
                return (
                <div key={person._id} className="person-tile">
                  {/* Header Section - Name, Title, Department on left, Actions on right */}
                  <div className="person-header-section">
                    <h3 className="person-name">{person.firstName} {person.lastName}</h3>
                    <p className="person-title">{person.jobTitle}</p>
                    {person.department && (
                      <p className="person-department">{person.department}</p>
                    )}
                  </div>
                  
                  {/* Action Buttons - Top Right */}
                  {user?.role === 'creator' && (
                    <div className="person-actions">
                      <button 
                        onClick={() => handleEdit(person)}
                        className="edit-btn"
                        title="Edit person"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deletePerson(person._id)}
                        className="delete-btn"
                        title="Delete person"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                  
                  {/* Content Section - Image and Bio side by side */}
                  <div className="person-content-section">
                    {/* Image Section */}
                    <div className="person-image-section">
                      {person.profilePhoto ? (
                        <img 
                          src={`http://localhost:5001/${person.profilePhoto}`} 
                          alt={`${person.firstName} ${person.lastName}`}
                          className="person-photo"
                          onError={(e) => {
                            console.error('Image failed to load:', person.profilePhoto);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="person-photo-placeholder" style={{ display: person.profilePhoto ? 'none' : 'flex' }}>
                        👤
                      </div>
                    </div>
                    
                    {/* Bio Section */}
                    <div className="person-bio-section">
                      {person.bio && (
                        <p className="person-bio">{person.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default People;

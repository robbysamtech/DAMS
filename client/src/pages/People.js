import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './People.css';

const People = () => {
  const { token, isEditor, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    churchRole: '',
    churchMinistry: [],
    bio: '',
    profilePhoto: null
  });
  const [photoPreview, setPhotoPreview] = useState('');

  const fetchPeople = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/people', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      } else {
        setError(t('errors.general'));
      }
    } catch (err) {
      setError(t('errors.network'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Filter people based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPeople(people);
    } else {
      const filtered = people.filter(person => {
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const role = (person.churchRole || person.role || '').toLowerCase();
        const ministry = Array.isArray(person.churchMinistry) 
          ? person.churchMinistry.join(' ').toLowerCase()
          : (person.churchMinistry || '').toLowerCase();
        const bio = (person.bio || '').toLowerCase();
        
        return fullName.includes(searchQuery.toLowerCase()) ||
               role.includes(searchQuery.toLowerCase()) ||
               ministry.includes(searchQuery.toLowerCase()) ||
               bio.includes(searchQuery.toLowerCase());
      });
      setFilteredPeople(filtered);
    }
  }, [people, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMinistryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      churchMinistry: checked
        ? [...prev.churchMinistry, value]
        : prev.churchMinistry.filter(ministry => ministry !== value)
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
      churchRole: '',
      churchMinistry: [],
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
    
    // Validate that at least one ministry is selected
    if (formData.churchMinistry.length === 0) {
      setError('Please select at least one ministry');
      return;
    }
    
    
    try {
        const formDataToSend = new FormData();
        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        formDataToSend.append('churchRole', formData.churchRole);
        formDataToSend.append('role', formData.churchRole); // Map churchRole to role field
        // Send each ministry as a separate field
        formData.churchMinistry.forEach(ministry => {
          formDataToSend.append('churchMinistry', ministry);
        });
        formDataToSend.append('bio', formData.bio);
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }


      const response = await fetch('http://localhost:5001/api/people', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });


      if (response.ok) {
        const newPerson = await response.json();
        setPeople(prev => [newPerson.person, ...prev]);
        resetForm();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create person');
      }
    } catch (err) {
      setError('Error creating person');
    }
  };

  const handleEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      churchRole: person.churchRole || person.role || '',
      churchMinistry: person.churchMinistry || [],
      bio: person.bio || '',
      profilePhoto: null
    });
    setPhotoPreview(null); // Clear any previous preview
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validate that at least one ministry is selected
    if (formData.churchMinistry.length === 0) {
      setError('Please select at least one ministry');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('churchRole', formData.churchRole);
      formDataToSend.append('role', formData.churchRole); // Map churchRole to role field
      // Send each ministry as a separate field
      formData.churchMinistry.forEach(ministry => {
        formDataToSend.append('churchMinistry', ministry);
      });
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
    if (!window.confirm(t('people.delete_member'))) return;
    
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
        setError(t('errors.general'));
      }
    } catch (err) {
      setError(t('errors.network'));
    }
  };

  if (loading) {
    return (
      <div className="people-page">
        <div className="container">
          <div className="loading">{t('loading.spinner_text')}</div>
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

        {/* Search Section */}
        <div className="search-section">
          <div className="search-row">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search people by name, role, ministry, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            {(isEditor || isAdmin) && (
              <div className="search-actions">
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="btn btn-primary"
                >
                  {showCreateForm ? t('common.cancel') : '+New Person'}
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Create Person Form */}
        {showCreateForm && (
              <form onSubmit={handleSubmit} className="create-form">
                <h3>{t('people.add_member')}</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">{t('people.form.first_name')}</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('people.form.first_name_placeholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">{t('people.form.last_name')}</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('people.form.last_name_placeholder')}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="churchRole">{t('people.form.role')}</label>
                    <select
                      id="churchRole"
                      name="churchRole"
                      value={formData.churchRole}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">{t('people.form.role_placeholder')}</option>
                      <option value="Pastor">{t('people.roles.pastor')}</option>
                      <option value="Leader">{t('people.roles.leader')}</option>
                      <option value="Member">{t('people.roles.member')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Ministries</label>
                    <div className="checkbox-group">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Gospel"
                          checked={formData.churchMinistry.includes('Gospel')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Gospel
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Children's Ministry"
                          checked={formData.churchMinistry.includes('Children\'s Ministry')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Children's Ministry
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Bible Study"
                          checked={formData.churchMinistry.includes('Bible Study')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Bible Study
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Easter Committee"
                          checked={formData.churchMinistry.includes('Easter Committee')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Easter Committee
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Harvest Committee"
                          checked={formData.churchMinistry.includes('Harvest Committee')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Harvest Committee
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profilePhoto">{t('people.form.profile_photo')}</label>
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
                  <label htmlFor="bio">{t('people.form.bio')}</label>
                                      <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('people.form.bio_placeholder')}
                      rows="3"
                    />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    {t('people.form.submit')}
                  </button>
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}

            {/* Edit Person Form */}
            {showEditForm && editingPerson && (
              <form onSubmit={handleUpdate} className="create-form">
                <h3>{t('people.edit_member')}</h3>
                
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
                    <label htmlFor="editChurchRole">Role</label>
                    <select
                      id="editChurchRole"
                      name="churchRole"
                      value={formData.churchRole}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Leader">Leader</option>
                      <option value="Member">Member</option>
                    </select>
                  </div>

                                    <div className="form-group">
                    <label>Ministries</label>
                    <div className="checkbox-group">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Gospel"
                          checked={formData.churchMinistry.includes('Gospel')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Gospel
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Children's Ministry"
                          checked={formData.churchMinistry.includes('Children\'s Ministry')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Children's Ministry
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Bible Study"
                          checked={formData.churchMinistry.includes('Bible Study')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Bible Study
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Easter Committee"
                          checked={formData.churchMinistry.includes('Easter Committee')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Easter Committee
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="churchMinistry"
                          value="Harvest Committee"
                          checked={formData.churchMinistry.includes('Harvest Committee')}
                          onChange={handleMinistryChange}
                        />
                        <span className="checkmark"></span>
                        Harvest Committee
                      </label>
                    </div>
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
                    {t('people.form.update')}
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

        {/* Team Members */}
        <div className="team-section">
          <h2>{t('people.page_title')} ({people.length})</h2>
          
          {people.length === 0 ? (
            <div className="no-people">
              <p>{t('people.display.no_members')}</p>
              {(isEditor || isAdmin) && (
                <p>{t('people.add_member')}</p>
              )}
            </div>
          ) : (
            <div className="people-grid">
              {filteredPeople.map(person => {
                return (
                <div key={person._id} className="person-tile">
                  {/* Header Section - Name, Role, Ministry on left, Actions on right */}
                  <div className="person-header-section">
                    <h3 className="person-name">{person.firstName} {person.lastName}</h3>
                    <p className="person-title">{person.churchRole || person.role}</p>
                    {person.churchMinistry && person.churchMinistry.length > 0 && (
                      <p className="person-department">
                        {Array.isArray(person.churchMinistry) 
                          ? person.churchMinistry.join(', ')
                          : person.churchMinistry
                        }
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons - Top Right */}
                  {(isEditor || isAdmin) && (
                    <div className="person-actions">
                      <button 
                        onClick={() => handleEdit(person)}
                        className="btn-edit"
                        title={t('people.edit_member')}
                      >
                        {t('common.edit')}
                      </button>
                      <button 
                        onClick={() => deletePerson(person._id)}
                        className="btn-delete"
                        title={t('people.delete_member')}
                      >
                        {t('common.delete')}
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

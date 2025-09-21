import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MinistrySectionEdit from './MinistrySectionEdit';
import './MinistryEditWrapper.css';

const MinistryEditWrapper = ({ 
  ministryName, 
  apiEndpoint, 
  backRoute, 
  pageTitle 
}) => {
  const { isEditor, isAdmin, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Fetch existing ministry sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${apiEndpoint}/admin`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sections');
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setSections(data.filter(section => section && section._id && section.title));
        } else {
          setSections([]);
        }
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${pageTitle} sections:`, err);
        setError(err.message);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSections();
    }
  }, [token, apiEndpoint, pageTitle]);

  // Show alert and hide after 3 seconds
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle edit button click
  const handleEditSection = (sectionId) => {
    const section = sections.find(s => s._id === sectionId);
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

  // Handle input change
  const handleSectionInputChange = (sectionId, field, value) => {
    setSectionFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };

  // Handle file change
  const handleSectionFileChange = (sectionId, file) => {
    setSections(prev =>
      prev.map(section =>
        section._id === sectionId
          ? { ...section, tempTileFile: file, tileImagePreview: file ? URL.createObjectURL(file) : null }
          : section
      )
    );
  };

  // Handle save button click
  const handleSaveSection = async (sectionId) => {
    const formData = sectionFormData[sectionId];
    if (!formData) return;

    console.log('Saving section:', sectionId, formData);
    
    try {
      // First update the text fields
      const response = await fetch(`${apiEndpoint}/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: formData.order,
          title: formData.title,
          description: formData.description,
          })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const updatedSection = await response.json();

        // Find the section index for image upload
        const sectionIndex = sections.findIndex(s => s._id === sectionId);
        const section = sections[sectionIndex];

        console.log('Section found:', section);
        console.log('Has tempTileFile:', !!section?.tempTileFile);

        // Upload tile image if a new one was selected
        if (section?.tempTileFile) {
          console.log('Uploading tile image:', section.tileImage);
          const imageFormData = new FormData();
          imageFormData.append('tileImage', section.tempTileFile);

          const tileResponse = await fetch(`${apiEndpoint}/${sectionId}/tile-image`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: imageFormData
          });

          console.log('Tile image response status:', tileResponse.status);

          if (tileResponse.ok) {
            const updatedSectionWithImage = await tileResponse.json();
            setSections(prev =>
              prev.map(s =>
                s._id === sectionId ? {
                  ...updatedSectionWithImage,
                  tempTileFile: null,
                  tileImagePreview: null
                } : s
              )
            );
          } else {
            const errorText = await tileResponse.text();
            console.error('Error uploading tile image:', errorText);
          }
        } else {
          console.log('No tile image to upload');
          // No image to upload, just update with text changes
          setSections(prev =>
            prev.map(s =>
              s._id === sectionId ? updatedSection : s
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

  // Add new section
  const addNewSection = async () => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: sections.length + 1,
          title: 'New Section',
          description: 'Enter description here',
          })
      });

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      const newSection = await response.json();
      setSections(prev => [...prev, newSection]);
      showAlert('New section created successfully!');
    } catch (err) {
      showAlert(`Error creating section: ${err.message}`, 'error');
    }
  };

  // Auth check
  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isEditor && !isAdmin) {
    return (
      <div className="error">
        <h2>Access Denied</h2>
        <p>You don't have permission to edit {pageTitle} sections.</p>
        <button onClick={() => navigate(backRoute)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading sections...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`edit-${ministryName.toLowerCase()}-ministry-page`}>
      {/* Alert */}
      {alert.show && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="edit-header">
        <h1>Edit {pageTitle}</h1>
        <div className="header-actions">
          <button onClick={() => navigate(backRoute)} className="btn-secondary">
            Back to {pageTitle}
          </button>
          <button onClick={addNewSection} className="btn-primary">
            Add New Section
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="sections-container">
        {sections.length > 0 ? (
          sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const isEditing = editingSections[section._id];
              const formData = sectionFormData[section._id] || {};
              
              return (
                <MinistrySectionEdit
                  key={section._id}
                  section={section}
                  index={index}
                  isEditing={isEditing}
                  formData={formData}
                  onEdit={handleEditSection}
                  onCancel={handleCancelEdit}
                  onSave={handleSaveSection}
                  onInputChange={handleSectionInputChange}
                  onFileChange={handleSectionFileChange}
                  ministryName={ministryName}
                />
              );
            })
        ) : (
          <div className="no-sections">
            <p>No sections found. Create your first section!</p>
            <button onClick={addNewSection} className="btn-primary">
              Add First Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinistryEditWrapper;

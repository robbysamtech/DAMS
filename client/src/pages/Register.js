import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userIdAvailable, setUserIdAvailable] = useState(null);
  const [checkingUserId, setCheckingUserId] = useState(false);
  
  const { register } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    
    // Reset user ID availability when user changes the ID
    if (name === 'userId') {
      setUserIdAvailable(null);
    }
  };

  // Generate user ID based on first and last name
  const generateUserId = React.useCallback(async () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter first and last name to generate User ID');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/generate-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });

      const data = await response.json();
      if (data.userId) {
        setFormData(prev => ({
          ...prev,
          userId: data.userId
        }));
        setUserIdAvailable(null); // Reset availability check
      }
    } catch (error) {
      setError('Failed to generate User ID');
    }
  }, [formData.firstName, formData.lastName]);

  // Check if user ID is available
  const checkUserIdAvailability = async (userId) => {
    if (!userId) {
      setUserIdAvailable(null);
      return;
    }

    setCheckingUserId(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/check-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      setUserIdAvailable(data.available);
    } catch (error) {
      setUserIdAvailable(null);
    } finally {
      setCheckingUserId(false);
    }
  };

  // Handle User ID generation on focus
  const handleUserIdFocus = () => {
    if (formData.firstName && formData.lastName && !formData.userId) {
      generateUserId();
    }
  };

  // Check user ID availability when user ID changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.userId) {
        checkUserIdAvailability(formData.userId);
      }
    }, 500); // Debounce the check

    return () => clearTimeout(timeoutId);
  }, [formData.userId]);

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!formData.userId) {
      setError('User ID is required');
      return false;
    }

    if (userIdAvailable === false) {
      setError('This User ID is already taken. Please choose a different one.');
      return false;
    }

    if (userIdAvailable === null && formData.userId) {
      setError('Please wait while we check if your User ID is available');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        userId: formData.userId,
        password: formData.password
      });
      
      
      if (result.success) {
        if (result.message) {
          // Show the custom message from AuthContext
          setSuccess(result.message);
        } else {
          setSuccess('Registration successful! You can now log in.');
        }
        
        // Clear the form
        setFormData({
          firstName: '',
          lastName: '',
          userId: '',
          password: '',
          confirmPassword: ''
        });
        setUserIdAvailable(null);
        
        // Don't redirect - let user see the success message and choose what to do next
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && 
                     formData.userId && formData.password && 
                     formData.confirmPassword && userIdAvailable === true;

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Request Account</h1>
            <p>Request access to join our church community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success">
                <div className="success-content">
                  <div className="success-icon">✅</div>
                  <div className="success-text">
                    <p>{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your first name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your last name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userId" className="form-label">
                User ID
                <span className="required">*</span>
              </label>
              <div className="user-id-input-group">
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  onFocus={handleUserIdFocus}
                  className={`form-input ${userIdAvailable === false ? 'error' : userIdAvailable === true ? 'success' : ''}`}
                  placeholder="Enter / Generate your user id"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={generateUserId}
                  className="btn btn-outline btn-small"
                  disabled={loading || !formData.firstName || !formData.lastName}
                  title="Generate User ID from name"
                >
                  Generate
                </button>
              </div>
              <div className="user-id-status">
                {checkingUserId && (
                  <small className="form-help checking">
                    <span className="loading-spinner-small"></span>
                    Checking availability...
                  </small>
                )}
                {userIdAvailable === true && (
                  <small className="form-help success">
                    ✅ User ID is available
                  </small>
                )}
                {userIdAvailable === false && (
                  <small className="form-help error">
                    ❌ User ID is already taken
                  </small>
                )}
                {!checkingUserId && userIdAvailable === null && formData.userId && (
                  <small className="form-help">
                    User ID will be checked automatically
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Create a password"
                required
                disabled={loading}
                minLength="8"
              />
              <small className="form-help">
                Password must be at least 8 characters long
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-info">
              <p>
                <strong>Important:</strong> Your account request will be reviewed by an administrator before you can access all features.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Requesting Account...
                </>
              ) : (
                'Request Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

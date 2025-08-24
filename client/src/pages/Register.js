import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
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
      console.log('Submitting registration...');
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      console.log('Registration result:', result);
      
      if (result.success) {
        if (result.message) {
          // Show the custom message from AuthContext
          console.log('Setting success message:', result.message);
          setSuccess(result.message);
        } else {
          console.log('Setting default success message');
          setSuccess('Registration successful! You can now log in.');
        }
        
        // Clear the form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Don't redirect - let user see the success message and choose what to do next
      } else {
        console.log('Registration failed:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && 
                     formData.email && formData.password && 
                     formData.confirmPassword;

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join DAMS to manage your ministry effectively</p>
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
                    <h3>Registration Successful!</h3>
                    <p>{success}</p>
                    <div className="next-steps">
                      <p><strong>What happens next?</strong></p>
                      <ul>
                        <li>An administrator will review your registration</li>
                        <li>You'll receive an email notification once approved</li>
                        <li>You can then log in and access the platform</li>
                      </ul>
                    </div>
                    <div className="success-actions">
                      <Link to="/login" className="btn btn-secondary">
                        Go to Login
                      </Link>
                      <button 
                        onClick={() => setSuccess('')} 
                        className="btn btn-outline"
                      >
                        Register Another Account
                      </button>
                    </div>
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
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
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
                <strong>Important:</strong> Your account will be reviewed by an administrator 
                before you can access all features. You'll receive an email notification 
                once your account is approved.
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

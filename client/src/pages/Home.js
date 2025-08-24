import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Digital Asset Management System
            </h1>
            <p className="hero-subtitle">
              Streamline your ministry operations with our comprehensive platform for managing events, 
              people, and ministry sections. Built for modern ministry organizations.
            </p>
            <div className="hero-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-large">
                    Sign In
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-cards">
              <div className="hero-card hero-card-1">
                <div className="card-icon">📅</div>
                <h3>Events</h3>
                <p>Manage ministry events</p>
              </div>
              <div className="hero-card hero-card-2">
                <div className="card-icon">👥</div>
                <h3>People</h3>
                <p>Team member profiles</p>
              </div>
              <div className="hero-card hero-card-3">
                <div className="card-icon">🏛️</div>
                <h3>Sections</h3>
                <p>Ministry organization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Platform Features</h2>
            <p className="section-subtitle">
              Everything you need to manage your ministry effectively
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Role-Based Access</h3>
              <p>
                Secure role-based access control with admin approval workflow. 
                Creators can manage content, consumers can view and interact.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>
                Seamlessly adapts to all devices with fluid layouts that maintain 
                consistency during window resizing. Mobile-first approach.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🏗️</div>
              <h3>Ministry Sections</h3>
              <p>
                Organize your ministry with hierarchical sections. Create, manage, 
                and organize people within logical ministry groups.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Event Management</h3>
              <p>
                Comprehensive event creation and management. Schedule events, 
                manage registrations, and track attendance.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>People Profiles</h3>
              <p>
                Detailed team member profiles with photos, roles, and responsibilities. 
                Easy to manage and organize within ministry sections.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>
                Enterprise-grade security with JWT authentication, rate limiting, 
                and comprehensive data validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Ministry?</h2>
            <p>
              Join thousands of ministry organizations already using DAMS to streamline 
              their operations and improve team collaboration.
            </p>
            <div className="cta-actions">
              {!isAuthenticated ? (
                <Link to="/register" className="btn btn-primary btn-large">
                  Start Free Trial
                </Link>
              ) : (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Access Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

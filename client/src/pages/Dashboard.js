import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isCreator, isConsumer } = useAuth();

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.firstName}!</h1>
          <p>Here's what's happening with your ministry</p>
        </div>

        <div className="dashboard-content">
          {user?.status === 'pending' && (
            <div className="alert alert-warning">
              <h3>Account Pending Approval</h3>
              <p>
                Your account is currently under review by an administrator. 
                You'll receive an email notification once your account is approved.
              </p>
            </div>
          )}

          {user?.status === 'active' && (
            <>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>Quick Stats</h3>
                    <p>Your ministry overview</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🗓️</div>
                  <div className="stat-content">
                    <h3>Upcoming Events</h3>
                    <p>View and manage events</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Team Members</h3>
                    <p>Manage ministry team</p>
                  </div>
                </div>
                

              </div>

              {isCreator && (
                <div className="dashboard-section">
                  <h2>Creator Tools</h2>
                  <div className="action-grid">
                    <button className="action-card">
                      <span className="action-icon">➕</span>
                      <h3>Create Event</h3>
                      <p>Schedule a new ministry event</p>
                    </button>
                    
                    <button className="action-card">
                      <span className="action-icon">👤</span>
                      <h3>Add Team Member</h3>
                      <p>Add someone to your ministry</p>
                    </button>
                    

                  </div>
                </div>
              )}

              {isConsumer && (
                <div className="dashboard-section">
                  <h2>Browse Content</h2>
                  <div className="action-grid">
                    <button className="action-card">
                      <span className="action-icon">🗓️</span>
                      <h3>View Events</h3>
                      <p>See upcoming ministry events</p>
                    </button>
                    
                    <button className="action-card">
                      <span className="action-icon">👥</span>
                      <h3>Meet the Team</h3>
                      <p>Learn about ministry members</p>
                    </button>
                    

                  </div>
                </div>
              )}


            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

// Active Users List Component
const ActiveUsersList = ({ token, onUserUpdate, setSuccessMessage }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActiveUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.users || []);
      } else {
        setError('Failed to fetch active users');
      }
    } catch (err) {
      setError('Error fetching active users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setActiveUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        onUserUpdate(); // Refresh statistics
        setSuccessMessage('User role updated successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role');
    }
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'suspended' })
      });

      if (response.ok) {
        setActiveUsers(prev => prev.filter(user => user._id !== userId));
        onUserUpdate(); // Refresh statistics
        setSuccessMessage('User suspended successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to suspend user');
      }
    } catch (err) {
      setError('Error suspending user');
    }
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  if (loading) {
    return <div className="loading">Loading active users...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (activeUsers.length === 0) {
    return <div className="no-active-users"><p>No active users found.</p></div>;
  }

  return (
    <div className="active-users">
      {activeUsers.map(user => (
        <div key={user._id} className="active-user-card">
          <div className="user-info">
            <h3>{user.firstName} {user.lastName}</h3>
            <p className="user-email">{user.email}</p>
            <p className="user-role">Role: <span className={`role-badge role-${user.role}`}>{user.role}</span></p>
            <p className="user-date">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="user-actions">
            <div className="role-selection">
              <label htmlFor={`active-role-${user._id}`}>Change Role:</label>
              <select 
                id={`active-role-${user._id}`} 
                value={user.role}
                onChange={(e) => updateUserRole(user._id, e.target.value)}
                className="role-select"
              >
                <option value="consumer">Content Consumer</option>
                <option value="creator">Content Creator</option>
              </select>
            </div>
            <button 
              onClick={() => suspendUser(user._id)}
              className="btn btn-warning"
              title="Suspend this user"
            >
              ⚠️ Suspend
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rejectDialog, setRejectDialog] = useState({ show: false, userId: null, reason: '' });

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch pending users:', errorText);
        setError('Failed to fetch pending users');
      }
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Error fetching pending users');
    }
  }, [token]);

  const fetchCreatorCount = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?role=creator&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          creators: data.users?.length || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching creator count:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match what the frontend expects
        const transformedStats = {
          totalUsers: data.userStats?.total || 0,
          pendingUsers: data.userStats?.pending || 0,
          activeUsers: data.userStats?.active || 0,
          creators: 0, // We'll count this separately
          ministrySections: data.contentStats?.ministrySections || 0,
          people: data.contentStats?.people || 0,
          events: data.contentStats?.events || 0
        };
        setStats(transformedStats);
        
        // Fetch creator count separately
        fetchCreatorCount();
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch statistics:', errorText);
        setError('Failed to fetch statistics');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error fetching statistics');
      setLoading(false);
    }
  }, [token, fetchCreatorCount]);

  // Fetch pending users and statistics
  useEffect(() => {
    if (token) {
      fetchPendingUsers();
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [token, fetchPendingUsers, fetchStatistics]);

  const approveUser = async (userId, role) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        // Remove user from pending list and refresh
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        fetchStatistics(); // Refresh stats
        setSuccessMessage(`User approved successfully as ${role}!`);
        setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
      } else {
        setError('Failed to approve user');
      }
    } catch (err) {
      setError('Error approving user');
    }
  };

  const showRejectDialog = (userId) => {
    setRejectDialog({ show: true, userId, reason: '' });
  };

  const hideRejectDialog = () => {
    // Add a small delay for smooth animation
    const modal = document.querySelector('.modal-content');
    if (modal) {
      modal.style.animation = 'modalSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        setRejectDialog({ show: false, userId: null, reason: '' });
      }, 200);
    } else {
      setRejectDialog({ show: false, userId: null, reason: '' });
    }
  };

  const rejectUser = async () => {
    const { userId, reason } = rejectDialog;
    if (!reason.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Remove user from pending list and refresh
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        fetchStatistics(); // Refresh stats
        setSuccessMessage('User rejected successfully!');
        setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
        hideRejectDialog();
      } else {
        setError('Failed to reject user');
      }
    } catch (err) {
      setError('Error rejecting user');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.firstName}! Manage your platform here.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">&times;</button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
            <button onClick={() => setSuccessMessage('')} className="alert-close">&times;</button>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pendingUsers || 0}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activeUsers || 0}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.creators || 0}</div>
            <div className="stat-label">Content Creators</div>
          </div>
        </div>

        {/* Pending User Approvals */}
        <div className="admin-section">
          <h2>Pending User Approvals ({pendingUsers.length})</h2>
          <p className="section-description">
            Review and approve new user registrations. Assign appropriate roles based on their intended use of the platform.
          </p>
          {pendingUsers.length === 0 ? (
            <div className="no-pending">
              <p>No users waiting for approval.</p>
            </div>
          ) : (
            <div className="pending-users">
              {pendingUsers.map(user => (
                <div key={user._id} className="pending-user-card">
                  <div className="user-info">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p className="user-email">{user.email}</p>
                    <p className="user-date">Applied: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="user-actions">
                    <div className="role-selection">
                      <label htmlFor={`role-${user._id}`}>Assign Role:</label>
                      <select 
                        id={`role-${user._id}`} 
                        defaultValue="consumer"
                        className="role-select"
                      >
                        <option value="consumer">Content Consumer</option>
                        <option value="creator">Content Creator</option>
                      </select>
                    </div>
                    <div className="action-buttons">
                      <button 
                        onClick={() => approveUser(user._id, document.getElementById(`role-${user._id}`).value)}
                        className="btn btn-success"
                        title="Approve this user with the selected role"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => showRejectDialog(user._id)}
                        className="btn btn-danger"
                        title="Reject this user registration"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Users Management */}
        <div className="admin-section">
          <h2>Active Users ({stats.activeUsers || 0})</h2>
          <p className="section-description">
            View and manage all approved users in the system. You can change roles or suspend users if needed.
          </p>
          <ActiveUsersList token={token} onUserUpdate={fetchStatistics} setSuccessMessage={setSuccessMessage} />
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <h2>Recent Activity</h2>
          <div className="recent-activity">
            <p>Activity monitoring coming soon...</p>
          </div>
        </div>

        {/* Rejection Dialog */}
        {rejectDialog.show && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Reject User</h3>
                <button onClick={hideRejectDialog} className="modal-close">&times;</button>
              </div>
              <p>Please provide a reason for rejecting this user:</p>
              <textarea
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter rejection reason..."
                rows="3"
                className="rejection-reason"
              />
              <div className="modal-actions">
                <button onClick={hideRejectDialog} className="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={rejectUser} 
                  className="btn btn-danger"
                  disabled={!rejectDialog.reason.trim()}
                >
                  Reject User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

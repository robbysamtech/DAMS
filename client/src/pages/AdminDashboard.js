import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

// Approved Users List Component
const ApprovedUsersList = ({ token, onUserUpdate, setSuccessMessage }) => {
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
        const errorText = await response.text();
        setError('Failed to fetch approved users');
      }
    } catch (err) {
      setError('Error fetching approved users');
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

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      
      if (response.ok) {
        const result = await response.json();
        setActiveUsers(prev => prev.filter(user => user._id !== userId));
        onUserUpdate(); // Refresh statistics
        setSuccessMessage('User deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorText = await response.text();
        setError(`Failed to delete user: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Error deleting user: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  if (loading) {
    return <div className="loading">Loading approved users...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (activeUsers.length === 0) {
    return <div className="no-active-users"><p>No approved users found.</p></div>;
  }

  return (
    <div className="active-users">
      {activeUsers.map(user => (
        <div key={user._id} className="active-user-card">
          <div className="user-info">
            <div className="user-name-container">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className={`role-badge role-${user.role}`}>
                {user.role === 'superadmin' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
            <p className="user-id">User ID: {user.userId}</p>
          </div>
          <div className="user-actions">
            <div className="role-selection">
              <label htmlFor={`active-role-${user._id}`}>Change Role:</label>
              <select 
                id={`active-role-${user._id}`} 
                value={user.role}
                onChange={(e) => updateUserRole(user._id, e.target.value)}
                className="role-select"
                disabled={user.role === 'superadmin'}
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
              </select>
            </div>
            {user.role !== 'superadmin' && (
              <button 
                onClick={() => deleteUser(user._id)}
                className="btn-delete"
                title="Delete this user"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    editors: 0,
    admins: 0,
    people: 0,
    events: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
        setError('Failed to fetch pending users');
      }
    } catch (err) {
      setError('Error fetching pending users');
    }
  }, [token]);

  const fetchEditorCount = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?role=editor&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          editors: data.users?.length || 0
        }));
      }
    } catch (err) {
    }
  }, [token]);

  const fetchAdminCount = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?role=admin&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          admins: data.users?.length || 0
        }));
      }
    } catch (err) {
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
          editors: 0, // We'll count this separately
          admins: 0, // We'll count this separately

          people: data.contentStats?.people || 0,
          events: data.contentStats?.events || 0
        };
        setStats(transformedStats);
        
        // Fetch editor and admin counts separately
        fetchEditorCount();
        fetchAdminCount();
      } else {
        const errorText = await response.text();
        setError('Failed to fetch statistics');
        setLoading(false);
      }
    } catch (err) {
      setError('Error fetching statistics');
      setLoading(false);
    }
  }, [token, fetchEditorCount, fetchAdminCount]);

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
        setRefreshKey(prev => prev + 1); // Force ApprovedUsersList to refresh
      } else {
        setError('Failed to approve user');
      }
    } catch (err) {
      setError('Error approving user');
    }
  };

  const rejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejected by admin' })
      });

      if (response.ok) {
        // Remove user from pending list and refresh
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        fetchStatistics(); // Refresh stats
        setSuccessMessage('User rejected successfully!');
        setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
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
            <div className="stat-number">{stats.pendingUsers || 0}</div>
            <div className="stat-label">Pending Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activeUsers || 0}</div>
            <div className="stat-label">Approved Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.editors || 0}</div>
            <div className="stat-label">Editors</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.admins || 0}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>

        {/* Pending Users */}
        <div className="admin-section pending-users-section">
          <h2>Pending Users ({pendingUsers.length})</h2>
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
                    <p className="user-name">{user.firstName} {user.lastName}</p>
                    <p className="user-id">User ID: {user.userId}</p>
                  </div>
                  <div className="user-actions">
                    <div className="role-selection">
                      <label htmlFor={`role-${user._id}`}>Assign Role:</label>
                      <select 
                        id={`role-${user._id}`} 
                        defaultValue="editor"
                        className="role-select"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="action-buttons">
                      <button 
                        onClick={() => approveUser(user._id, document.getElementById(`role-${user._id}`).value)}
                        className="btn-edit"
                        title="Approve this user with the selected role"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => rejectUser(user._id)}
                        className="btn-delete"
                        title="Reject this user registration"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Users Management */}
        <div className="admin-section active-users-section">
          <h2>Approved Users ({stats.activeUsers || 0})</h2>
          <p className="section-description">
            View and manage all approved users in the system. You can change roles or delete users if needed.
          </p>
          <ApprovedUsersList 
            key={refreshKey}
            token={token} 
            onUserUpdate={fetchStatistics} 
            setSuccessMessage={setSuccessMessage} 
          />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
